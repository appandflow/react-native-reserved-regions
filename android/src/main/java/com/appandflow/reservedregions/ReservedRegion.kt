package com.appandflow.reservedregions

import android.graphics.Rect

internal data class ReservedRegion(
  val kind: String,
  val frame: Rect,
  val occludesContent: Boolean = false,
)
