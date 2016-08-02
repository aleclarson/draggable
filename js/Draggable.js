var Axis, Gesture, LazyVar, NativeValue, Responder, Type, emptyFunction, fromArgs, type;

NativeValue = require("component").NativeValue;

Responder = require("gesture").Responder;

emptyFunction = require("emptyFunction");

fromArgs = require("fromArgs");

LazyVar = require("LazyVar");

Type = require("Type");

Gesture = require("./Gesture");

Axis = require("./Axis");

type = Type("Draggable");

type.inherits(Responder);

type.defineOptions({
  axis: Axis.isRequired,
  offset: Number.withDefault(0),
  inverse: Boolean.withDefault(false),
  captureDistance: Number.withDefault(10),
  canDrag: Function.withDefault(emptyFunction.thatReturnsTrue),
  shouldRespondOnStart: Function.withDefault(emptyFunction.thatReturnsFalse),
  shouldCaptureOnMove: Function.withDefault(emptyFunction.thatReturnsTrue)
});

type.defineFrozenValues({
  axis: fromArgs("axis"),
  offset: function(options) {
    return NativeValue(options.offset);
  },
  _inverse: fromArgs("inverse"),
  _captureDistance: fromArgs("captureDistance"),
  _lockedAxis: function() {
    return LazyVar((function(_this) {
      return function() {
        var dx, dy;
        dx = Math.abs(_this.gesture.dx);
        dy = Math.abs(_this.gesture.dy);
        if (_this._isAxisDominant(dx, dy)) {
          return "x";
        }
        if (_this._isAxisDominant(dy, dx)) {
          return "y";
        }
        return null;
      };
    })(this));
  }
});

type.defineValues({
  _canDrag: fromArgs("canDrag")
});

type.defineMethods({
  _computeOffset: function(arg) {
    var distance, startOffset;
    startOffset = arg.startOffset, distance = arg.distance;
    this._inverse && (distance *= -1);
    return startOffset + distance;
  },
  _isAxisDominant: function(a, b) {
    return (a - 2) > b && (a >= this._captureDistance);
  },
  _canDragOnStart: function() {
    if (!this._canDrag(this.gesture)) {
      this.terminate();
      return false;
    }
    return true;
  },
  _canDragOnMove: function() {
    var lockedAxis;
    if (!this._canDrag(this.gesture)) {
      this.terminate();
      return false;
    }
    lockedAxis = this._lockedAxis.get();
    if (lockedAxis === null) {
      this._lockedAxis.reset();
      return false;
    }
    if (lockedAxis !== this.axis) {
      this.terminate();
      return false;
    }
    return true;
  }
});

type.overrideMethods({
  __createGesture: function(options) {
    options.axis = this.axis;
    return Gesture(options);
  },
  __shouldRespondOnStart: function() {
    if (!this._canDragOnStart()) {
      return false;
    }
    return this.__super(arguments);
  },
  __shouldRespondOnMove: function() {
    if (!this._canDragOnMove()) {
      return false;
    }
    return this.__super(arguments);
  },
  __shouldCaptureOnStart: function() {
    if (!this._canDragOnStart()) {
      return false;
    }
    return this.__super(arguments);
  },
  __shouldCaptureOnMove: function() {
    if (!this._canDragOnMove()) {
      return false;
    }
    return this.__super(arguments);
  },
  __onTouchMove: function(event) {
    var gesture;
    gesture = this.gesture;
    gesture.__onTouchMove(event);
    this.isGranted && (this.offset.value = this._computeOffset(gesture));
    return this._events.emit("didTouchMove", [gesture, event]);
  },
  __onTouchEnd: function(event) {
    var touches;
    touches = event.nativeEvent.touches;
    if (touches.length === 0) {
      this._lockedAxis.reset();
    }
    return this.__super(arguments);
  },
  __onGrant: function() {
    var ref;
    if ((ref = this.offset.animation) != null) {
      ref.stop();
    }
    this.gesture._startOffset = this.offset.value;
    return this.__super(arguments);
  }
});

type.defineStatics({
  Gesture: Gesture,
  Axis: Axis
});

module.exports = type.build();

//# sourceMappingURL=map/Draggable.map