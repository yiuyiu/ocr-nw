(function() {
  const path = require("path");
  const WW = window.innerWidth;
  const WH = window.innerHeight;
  const WIN = nw.Window.get();
  var background = function() {
    return {
      el: {},
      store: {},
      events: function() {},
      init: function() {
        // init select
        var canvas = document.getElementById("can1"),
          context = canvas.getContext("2d");
        canvas.width = WW;
        canvas.height = WH;
        this.el.canvas = canvas;
        this.el.context = context;
        const base64 = window.localStorage.getItem("screenshot64");
        const bgImg = new Image();
        bgImg.src = base64;
        bgImg.onload = function() {
          context.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        };
      }
    };
  };
  var overlay = function() {
    return {
      el: {},
      store: {
        ERASER_LINE_WIDTH: 1,
        bgColor: "rgba(0,0,0,.5)",
        drawingSurfaceImageData: null,
        lastX: 0,
        lastY: 0,
        mousedown: {},
        rubberbandRect: {},
        dragging: false
      },
      drawBg() {
        var ctx = this.el.context,
          can = this.el.canvas;
        ctx.save();

        ctx.fillStyle = this.store.bgColor;
        ctx.fillRect(0, 0, can.width, can.height);

        ctx.restore();
      },
      windowToCanvas(x, y) {
        var can = this.el.canvas;
        var bbox = can.getBoundingClientRect();
        return {
          x: x - bbox.left * (can.width / bbox.width),
          y: y - bbox.top * (can.height / bbox.height)
        };
      },
      saveDrawingSurface() {
        this.store.drawingSurfaceImageData = this.el.context.getImageData(
          0,
          0,
          this.el.canvas.width,
          this.el.canvas.height
        );
      },
      restoreDrawingSurface() {
        this.el.context.putImageData(this.store.drawingSurfaceImageData, 0, 0);
      },
      updateRubberbandRectangle(loc) {
        var store = this.store;
        store.rubberbandRect.width = Math.abs(loc.x - store.mousedown.x);
        store.rubberbandRect.height = Math.abs(loc.y - store.mousedown.y);

        if (loc.x > store.mousedown.x)
          store.rubberbandRect.left = store.mousedown.x;
        else store.rubberbandRect.left = loc.x;

        if (loc.y > store.mousedown.y)
          store.rubberbandRect.top = store.mousedown.y;
        else store.rubberbandRect.top = loc.y;
      },
      setEraseRectangle() {
        var ctx = this.el.context,
          can = this.el.canvas,
          store = this.store;
        ctx.save();
        ctx.beginPath();
        ctx.rect(
          store.rubberbandRect.left,
          store.rubberbandRect.top,
          store.rubberbandRect.width,
          store.rubberbandRect.height
        );
        ctx.clip();
        ctx.clearRect(0, 0, can.width, can.height);
        ctx.restore();
      },
      recongnize(ctx) {
        WIN.close();
        global._events.recognition.emit("recognizing", ctx);
      },
      events: function() {
        var store = this.store;
        var self = this;
        var canvas = this.el.canvas;
        canvas.onmousedown = e => {
          var loc = self.windowToCanvas(e.clientX, e.clientY);
          e.preventDefault();
          store.mousedown.x = loc.x;
          store.mousedown.y = loc.y;
          store.lastX = loc.x;
          store.lastY = loc.y;
          store.dragging = true;
        };
        canvas.onmousemove = e => {
          var loc;
          if (this.store.dragging) {
            e.preventDefault(); // prevent selections

            loc = this.windowToCanvas(e.clientX, e.clientY);
            this.updateRubberbandRectangle(loc);
            this.restoreDrawingSurface();
            this.setEraseRectangle();
            this.store.lastX = loc.x;
            this.store.lastY = loc.y;
            this.el.$btn.hide();
          }
        };
        canvas.onmouseup = e => {
          var loc = this.windowToCanvas(e.clientX, e.clientY);
          this.store.dragging = false;
          // if move then show the btns
          if (
            loc.x - this.store.mousedown.x &&
            loc.y - this.store.mousedown.y
          ) {
            this.displayBtn(loc);
          }
        };
        this.el.$confirm.click(() => {
          // get selected area
          var rect = self.store.rubberbandRect;
          var imgData = backgroundModule.el.context.getImageData(
            rect.left,
            rect.top,
            rect.width,
            rect.height
          );
          this.el.paintingCanvas.width = rect.width;
          this.el.paintingCanvas.height = rect.height;
          this.el.paintingContext.putImageData(imgData, 0, 0);
          this.recongnize(this.el.paintingContext);
        });
        this.el.$cancel.click(() => {
          WIN.close();
        });
      },
      displayBtn(loc) {
        var $btn = this.el.$btn;
        $btn.css("top", loc.y).css("left", loc.x);
        $btn.show();
      },
      init: function() {
        // init select
        var slts = {};
        slts.canvas = document.getElementById("can2");
        slts.canvas.width = WW;
        slts.canvas.height = WH;
        slts.context = slts.canvas.getContext("2d");
        slts.$btn = $(".btn-wrapper");
        // create a canvas for getSelected area
        slts.paintingCanvas = document.createElement("canvas");
        slts.paintingContext = slts.paintingCanvas.getContext("2d");
        slts.$confirm = $("#confirmSelect");
        slts.$cancel = $("#cancelSelect");
        this.el = slts;
        // bind events
        this.events();
        this.drawBg();
        this.saveDrawingSurface();
      }
    };
  };
  var backgroundModule = background();
  var overlayModule = overlay();
  backgroundModule.init();
  overlayModule.init();
})();
