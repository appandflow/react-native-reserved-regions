package com.reservedregions

import android.content.Context
import android.graphics.Rect
import android.os.Build
import android.view.ViewTreeObserver
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.window.WindowSdkExtensions
import androidx.window.java.layout.WindowInfoTrackerCallbackAdapter
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup
import kotlin.math.max
import kotlin.math.min

internal typealias RegionsChangeHandler = (ReservedRegionsView, List<ReservedRegion>) -> Unit

class ReservedRegionsView(context: Context) : ReactViewGroup(context), ViewTreeObserver.OnPreDrawListener {
  private var tracker: WindowInfoTrackerCallbackAdapter? = null
  private val layoutInfoConsumer = Consumer<WindowLayoutInfo> { info ->
    foldingFeatures = info.displayFeatures.filterIsInstance<FoldingFeature>()
    foldingFeaturesReady = true
    invalidate()
  }
  private var foldingFeatures: List<FoldingFeature> = emptyList()
  private var foldingFeaturesReady = false
  private var lastRegions: List<ReservedRegion>? = null
  private var onRegionsChange: RegionsChangeHandler? = null

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
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
    tracker?.removeWindowLayoutInfoListener(layoutInfoConsumer)
    tracker = null
    viewTreeObserver.removeOnPreDrawListener(this)
    super.onDetachedFromWindow()
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

  private fun updateRegions() {
    val handler = onRegionsChange ?: return
    if (!isAttachedToWindow || !foldingFeaturesReady || width == 0 || height == 0) return

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

    if (regions != lastRegions) {
      lastRegions = regions
      handler(this, regions)
    }
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
