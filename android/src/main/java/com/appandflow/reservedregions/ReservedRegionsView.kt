package com.appandflow.reservedregions

import android.content.Context
import android.graphics.Rect
import android.os.Build
import android.view.WindowInsets
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.window.WindowSdkExtensions
import androidx.window.java.layout.WindowInfoTrackerCallbackAdapter
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.UIManagerListener
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.views.view.ReactViewGroup
import kotlin.math.max
import kotlin.math.min

internal typealias RegionsChangeHandler = (ReservedRegionsView, List<ReservedRegion>, Boolean) -> Unit

@OptIn(UnstableReactNativeAPI::class)
class ReservedRegionsView(context: Context) : ReactViewGroup(context), UIManagerListener {
  private var uiManager: UIManager? = null
  private var tracker: WindowInfoTrackerCallbackAdapter? = null
  private val layoutInfoConsumer = Consumer<WindowLayoutInfo> { info ->
    foldingFeatures = info.displayFeatures.filterIsInstance<FoldingFeature>()
    foldingFeaturesReady = true
    if (hasDispatchedRegions) updateRegionsIfInputsChanged() else updateRegions()
  }
  private var foldingFeatures: List<FoldingFeature> = emptyList()
  private var foldingFeaturesReady = false
  private var lastRegions: List<ReservedRegion>? = null
  private var measuredInputs: MeasurementInputs? = null
  private var awaitingFirstMount = true
  private var hasDispatchedRegions = false
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
    if (!hasDispatchedRegions) {
      uiManager = UIManagerHelper.getUIManagerForReactTag(UIManagerHelper.getReactContext(this), id)
      awaitingFirstMount = true
      // React Native's FabricMountingManager.cpp applies layout before installing a view's event
      // emitter inside one mount batch, so onLayout cannot dispatch a synchronous event on first
      // mount; didMountItems is the earliest point after the emitter exists and before the event
      // beat. It runs for every mount batch in the app, so it is removed after the first delivery.
      uiManager?.addUIManagerEventListener(this)
      foldingFeatures = emptyList()
      lastRegions = null
    }
    foldingFeaturesReady = false
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
    if (hasDispatchedRegions) updateRegionsIfInputsChanged()
  }

  override fun onDetachedFromWindow() {
    uiManager?.removeUIManagerEventListener(this)
    uiManager = null
    tracker?.removeWindowLayoutInfoListener(layoutInfoConsumer)
    tracker = null
    super.onDetachedFromWindow()
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    if (!awaitingFirstMount) updateRegions()
  }

  override fun onApplyWindowInsets(insets: WindowInsets): WindowInsets {
    val result = super.onApplyWindowInsets(insets)
    if (!awaitingFirstMount) updateRegions()
    return result
  }

  internal fun setOnRegionsChangeHandler(handler: RegionsChangeHandler) {
    onRegionsChange = handler
    lastRegions = null
  }

  private fun updateRegions(): Boolean {
    val handler = onRegionsChange ?: return false
    if (!isAttachedToWindow || !foldingFeaturesReady || width == 0 || height == 0) return false

    val inputs = measurementInputs()
    measuredInputs = inputs
    val windowLocation = IntArray(2)
    getLocationInWindow(windowLocation)
    val regions = mutableListOf<ReservedRegion>()

    for (feature in inputs.foldingFeatures) {
      if (!feature.isSeparating && feature.occlusionType != FoldingFeature.OcclusionType.FULL) continue
      val frame = intersectingFrame(feature.bounds, windowLocation[0], windowLocation[1]) ?: continue
      regions.add(ReservedRegion("division", frame, feature.occlusionType == FoldingFeature.OcclusionType.FULL))
    }

    for (bounds in inputs.cutouts) {
      intersectingFrame(bounds, windowLocation[0], windowLocation[1])?.let { frame ->
        regions.add(ReservedRegion("occlusion", frame))
      }
    }

    if (regions == lastRegions) return false
    lastRegions = regions
    handler(this, regions, !hasDispatchedRegions)
    hasDispatchedRegions = true
    if (awaitingFirstMount) {
      awaitingFirstMount = false
      uiManager?.removeUIManagerEventListener(this)
    }
    return true
  }

  private fun updateRegionsIfInputsChanged() {
    if (measurementInputs() != measuredInputs) updateRegions()
  }

  private fun measurementInputs() = MeasurementInputs(
    foldingFeatures,
    if (Build.VERSION.SDK_INT >= 28) rootWindowInsets?.displayCutout?.boundingRects.orEmpty() else emptyList(),
    Rect(left, top, right, bottom),
  )

  private fun intersectingFrame(bounds: Rect, originX: Int, originY: Int): Rect? {
    val frame = Rect(bounds.left - originX, bounds.top - originY, bounds.right - originX, bounds.bottom - originY)
    val left = max(0, frame.left)
    val top = max(0, frame.top)
    val right = min(width, frame.right)
    val bottom = min(height, frame.bottom)
    if (right < left || bottom < top || (right == left && bottom == top)) return null
    return frame
  }
}

private data class MeasurementInputs(
  val foldingFeatures: List<FoldingFeature>,
  val cutouts: List<Rect>,
  val frame: Rect,
)
