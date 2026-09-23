package com.appandflow.reservedregions

import android.content.Context
import android.graphics.Rect
import android.os.Build
import android.view.Choreographer
import android.view.ViewTreeObserver
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.window.WindowSdkExtensions
import androidx.window.java.layout.WindowInfoTrackerCallbackAdapter
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.UIManagerListener
import com.facebook.react.common.LifecycleState
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.modules.core.ReactChoreographer
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.views.view.ReactViewGroup
import kotlin.math.max
import kotlin.math.min

internal typealias RegionsChangeHandler = (ReservedRegionsView, List<ReservedRegion>) -> Unit

@OptIn(UnstableReactNativeAPI::class)
class ReservedRegionsView(context: Context) : ReactViewGroup(context), ViewTreeObserver.OnPreDrawListener, UIManagerListener {
  private var uiManager: UIManager? = null
  private var tracker: WindowInfoTrackerCallbackAdapter? = null
  private val layoutInfoConsumer = Consumer<WindowLayoutInfo> { info ->
    foldingFeatures = info.displayFeatures.filterIsInstance<FoldingFeature>()
    foldingFeaturesReady = true
    invalidate()
  }
  private var foldingFeatures: List<FoldingFeature> = emptyList()
  private var foldingFeaturesReady = false
  private var lastRegions: List<ReservedRegion>? = null
  private var awaitingFirstMount = true
  private var eventInFrame = false
  private var remeasureAfterFrame = false
  // FabricUIManager.receiveEvent drops a synchronous event for a view that already received one
  // before its DISPATCH_UI frame callback ends; NATIVE_ANIMATED_MODULE callbacks run after that.
  // FabricUIManager.onHostPause unschedules DISPATCH_UI, so no frame clears it until the host resumes.
  private val frameEndCallback = Choreographer.FrameCallback {
    if ((context as? ThemedReactContext)?.reactApplicationContext?.lifecycleState != LifecycleState.RESUMED) {
      postFrameEndCallback()
      return@FrameCallback
    }
    eventInFrame = false
    if (remeasureAfterFrame) {
      remeasureAfterFrame = false
      updateRegions()
    }
  }
  private var onRegionsChange: RegionsChangeHandler? = null

  override fun willDispatchViewUpdates(uiManager: UIManager) {}

  override fun willMountItems(uiManager: UIManager) {}

  override fun didScheduleMountItems(uiManager: UIManager) {}

  override fun didDispatchMountItems(uiManager: UIManager) {}

  override fun didMountItems(uiManager: UIManager) {
    if (awaitingFirstMount) updateRegions()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    uiManager = UIManagerHelper.getUIManagerForReactTag(UIManagerHelper.getReactContext(this), id)
    awaitingFirstMount = true
    // React Native's FabricMountingManager.cpp applies layout before installing a view's event
    // emitter inside one mount batch, so onLayout cannot dispatch a synchronous event on first
    // mount; didMountItems is the earliest point after the emitter exists and before the event
    // beat. It runs for every mount batch in the app, so it is removed after the first delivery.
    uiManager?.addUIManagerEventListener(this)
    viewTreeObserver.addOnPreDrawListener(this)
    foldingFeatures = emptyList()
    foldingFeaturesReady = false
    lastRegions = null
    val activity = (context as? ThemedReactContext)?.currentActivity
    if (activity != null) {
      val windowTracker = WindowInfoTracker.getOrCreate(context)
      if (WindowSdkExtensions.getInstance().extensionVersion >= 9) {
        foldingFeatures = windowTracker.getCurrentWindowLayoutInfo(activity)
          .displayFeatures.filterIsInstance<FoldingFeature>()
        foldingFeaturesReady = true
      }
      tracker = WindowInfoTrackerCallbackAdapter(windowTracker)
      tracker?.addWindowLayoutInfoListener(activity, ContextCompat.getMainExecutor(context), layoutInfoConsumer)
    } else {
      foldingFeaturesReady = true
    }
  }

  override fun onDetachedFromWindow() {
    uiManager?.removeUIManagerEventListener(this)
    uiManager = null
    tracker?.removeWindowLayoutInfoListener(layoutInfoConsumer)
    tracker = null
    viewTreeObserver.removeOnPreDrawListener(this)
    ReactChoreographer.getInstance()
      .removeFrameCallback(ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE, frameEndCallback)
    eventInFrame = false
    remeasureAfterFrame = false
    super.onDetachedFromWindow()
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    if (!awaitingFirstMount) updateRegions()
  }

  override fun onPreDraw(): Boolean {
    updateRegions()
    return true
  }

  internal fun setOnRegionsChangeHandler(handler: RegionsChangeHandler) {
    onRegionsChange = handler
    lastRegions = null
    invalidate()
  }

  private fun updateRegions(): Boolean {
    val handler = onRegionsChange ?: return false
    if (!isAttachedToWindow || !foldingFeaturesReady || width == 0 || height == 0) return false

    val windowLocation = IntArray(2)
    getLocationInWindow(windowLocation)
    val regions = mutableListOf<ReservedRegion>()

    for (feature in foldingFeatures) {
      if (!feature.isSeparating && feature.occlusionType != FoldingFeature.OcclusionType.FULL) continue
      val frame = clippedFrame(feature.bounds, windowLocation[0], windowLocation[1]) ?: continue
      regions.add(ReservedRegion("division", frame, feature.occlusionType == FoldingFeature.OcclusionType.FULL))
    }

    if (Build.VERSION.SDK_INT >= 28) {
      val screenLocation = IntArray(2)
      getLocationOnScreen(screenLocation)
      rootWindowInsets?.displayCutout?.boundingRects?.forEach { bounds ->
        clippedFrame(bounds, screenLocation[0], screenLocation[1])?.let { frame ->
          regions.add(ReservedRegion("occlusion", frame))
        }
      }
    }

    if (regions == lastRegions) return false
    if (eventInFrame) {
      remeasureAfterFrame = true
      return false
    }
    lastRegions = regions
    eventInFrame = true
    postFrameEndCallback()
    handler(this, regions)
    if (awaitingFirstMount) {
      awaitingFirstMount = false
      uiManager?.removeUIManagerEventListener(this)
    }
    return true
  }

  private fun postFrameEndCallback() {
    ReactChoreographer.getInstance()
      .postFrameCallback(ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE, frameEndCallback)
  }

  private fun clippedFrame(bounds: Rect, originX: Int, originY: Int): Rect? {
    val left = max(0, bounds.left - originX)
    val top = max(0, bounds.top - originY)
    val right = min(width, bounds.right - originX)
    val bottom = min(height, bounds.bottom - originY)
    if (right < left || bottom < top || (right == left && bottom == top)) return null
    return Rect(left, top, right, bottom)
  }
}
