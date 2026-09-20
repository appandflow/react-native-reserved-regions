package com.reservedregions

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.events.Event

internal class RegionsChangeEvent(
  surfaceId: Int,
  viewTag: Int,
  private val regions: List<ReservedRegion>,
) : Event<RegionsChangeEvent>(surfaceId, viewTag) {
  override fun getEventName() = NAME

  override fun getEventData(): WritableMap {
    val payload = Arguments.createMap()
    val regionArray = Arguments.createArray()
    for (region in regions) {
      val frame = Arguments.createMap()
      frame.putDouble("x", PixelUtil.toDIPFromPixel(region.frame.left.toFloat()).toDouble())
      frame.putDouble("y", PixelUtil.toDIPFromPixel(region.frame.top.toFloat()).toDouble())
      frame.putDouble("width", PixelUtil.toDIPFromPixel(region.frame.width().toFloat()).toDouble())
      frame.putDouble("height", PixelUtil.toDIPFromPixel(region.frame.height().toFloat()).toDouble())
      val item = Arguments.createMap()
      item.putString("kind", region.kind)
      item.putMap("frame", frame)
      item.putBoolean("occludesContent", region.occludesContent)
      regionArray.pushMap(item)
    }
    payload.putArray("regions", regionArray)
    return payload
  }

  companion object {
    const val NAME = "topRegionsChange"
  }
}
