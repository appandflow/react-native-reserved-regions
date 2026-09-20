package com.reservedregions

import android.graphics.Color
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.ReservedRegionsViewManagerInterface
import com.facebook.react.viewmanagers.ReservedRegionsViewManagerDelegate

@ReactModule(name = ReservedRegionsViewManager.NAME)
class ReservedRegionsViewManager : SimpleViewManager<ReservedRegionsView>(),
  ReservedRegionsViewManagerInterface<ReservedRegionsView> {
  private val mDelegate: ViewManagerDelegate<ReservedRegionsView>

  init {
    mDelegate = ReservedRegionsViewManagerDelegate(this)
  }

  override fun getDelegate(): ViewManagerDelegate<ReservedRegionsView>? {
    return mDelegate
  }

  override fun getName(): String {
    return NAME
  }

  public override fun createViewInstance(context: ThemedReactContext): ReservedRegionsView {
    return ReservedRegionsView(context)
  }

  @ReactProp(name = "color")
  override fun setColor(view: ReservedRegionsView?, color: Int?) {
    view?.setBackgroundColor(color ?: Color.TRANSPARENT)
  }

  companion object {
    const val NAME = "ReservedRegionsView"
  }
}
