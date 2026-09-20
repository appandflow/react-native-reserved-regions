package com.reservedregions

import com.facebook.react.bridge.ReactContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.viewmanagers.ReservedRegionsViewManagerInterface
import com.facebook.react.viewmanagers.ReservedRegionsViewManagerDelegate

@ReactModule(name = ReservedRegionsViewManager.NAME)
class ReservedRegionsViewManager : ViewGroupManager<ReservedRegionsView>(),
  ReservedRegionsViewManagerInterface<ReservedRegionsView> {
  private val delegate = ReservedRegionsViewManagerDelegate(this)

  override fun getDelegate() = delegate

  override fun getName() = NAME

  override fun createViewInstance(context: ThemedReactContext) = ReservedRegionsView(context)

  override fun getExportedCustomDirectEventTypeConstants() =
    mutableMapOf(RegionsChangeEvent.NAME to mutableMapOf("registrationName" to "onRegionsChange"))

  override fun addEventEmitters(reactContext: ThemedReactContext, view: ReservedRegionsView) {
    super.addEventEmitters(reactContext, view)
    view.setOnRegionsChangeHandler { source, regions ->
      val sourceContext = source.context as ReactContext
      UIManagerHelper.getEventDispatcherForReactTag(sourceContext, source.id)
        ?.dispatchEvent(RegionsChangeEvent(UIManagerHelper.getSurfaceId(sourceContext), source.id, regions))
    }
  }

  companion object {
    const val NAME = "ReservedRegionsView"
  }
}
