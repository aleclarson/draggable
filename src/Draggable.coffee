
{AnimatedValue} = require "Animated"
{Responder} = require "gesture"

ResponderSyntheticEvent = require "ResponderSyntheticEvent"
emptyFunction = require "emptyFunction"
LazyVar = require "LazyVar"
Event = require "Event"
Type = require "Type"

Gesture = require "./Gesture"
Axis = require "./Axis"

type = Type "Draggable"

type.inherits Responder

type.defineOptions
  axis: Axis.isRequired
  offset: Number.withDefault 0
  captureDistance: Number.withDefault 10
  canDrag: Function.withDefault emptyFunction.thatReturnsTrue
  shouldRespondOnStart: Function.withDefault emptyFunction.thatReturnsFalse
  shouldCaptureOnMove: Function.withDefault emptyFunction.thatReturnsTrue

type.defineStatics {Gesture, Axis}

type.defineFrozenValues (options) ->

  axis: options.axis

  offset: AnimatedValue options.offset

  isHorizontal: options.axis is "x"

  _captureDistance: options.captureDistance

  _lockedAxis: LazyVar =>
    dx = Math.abs @gesture.dx
    dy = Math.abs @gesture.dy
    return "x" if @_isAxisDominant dx, dy
    return "y" if @_isAxisDominant dy, dx
    return null

type.defineValues (options) ->

  _canDrag: options.canDrag

#
# Prototype
#

type.addMixin Event.Mixin,

  didDrag: {gesture: Gesture, event: ResponderSyntheticEvent}

type.defineMethods

  _computeOffset: (gesture) ->
    gesture.startOffset + gesture.distance

  _isAxisDominant: (a, b) ->
    (a - 2) > b and (a >= @_captureDistance)

  _canDragOnStart: ->
    unless @_canDrag @gesture
      @terminate()
      return no
    return yes

  _canDragOnMove: ->

    unless @_canDrag @gesture
      @terminate()
      return no

    lockedAxis = @_lockedAxis.get()

    # Neither axis is dominant!
    if lockedAxis is null
      @_lockedAxis.reset()
      return no

    # The opposite axis is dominant!
    if lockedAxis isnt @axis
      @terminate()
      return no

    # Our axis is dominant!
    return yes

type.overrideMethods

  __createGesture: (options) ->
    options.axis = @axis
    options.startOffset = @offset.get()
    return Gesture options

  __shouldRespondOnStart: ->
    return no unless @_canDragOnStart()
    return @__super arguments

  __shouldRespondOnMove: ->
    return no unless @_canDragOnMove()
    return @__super arguments

  __shouldCaptureOnStart: ->
    return no unless @_canDragOnStart()
    return @__super arguments

  __shouldCaptureOnMove: ->
    return no unless @_canDragOnMove()
    return @__super arguments

  __onTouchMove: (event) ->
    {gesture} = this
    gesture.__onTouchMove event
    if @_isGranted
      @offset.set @_computeOffset gesture
      @__events.didDrag gesture, event
    @__events.didTouchMove gesture, event

  __onTouchEnd: (event) ->

    {touches} = event.nativeEvent
    if touches.length is 0
      @_lockedAxis.reset()

    @__super arguments

  __onGrant: ->
    @offset.stopAnimation()
    @__super arguments
    @gesture._startOffset = @offset.get() - @gesture.distance

module.exports = type.build()
