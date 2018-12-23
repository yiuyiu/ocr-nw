const fs = require("fs");
const path = require("path");
const EventEmitter = require("events");
const screenshot = require("desktop-screenshot");

axios.defaults.baseURL = "http://47.107.84.50";
const LOGIN_TIME_OUT = 31536000;
const API = {
  login: username => `/users/${username}/login`,
  list: `/detections`,
  detect: detectId => `/detections/${detectId}/lesions`
};
// 返回拦截
axios.interceptors.response.use(
  function(res) {
    if (res && res.data) {
      return res.data;
    } else {
      return Promise.reject(res);
    }
  },
  function(error) {
    // 如果响应是空的
    if (!error.response) {
      Message.error(error.message ? error.message : "network error");
    }
    let data = error.response.data;
    // 令牌过期
    if (data.code == "TOKEN_EXPIRED") {
      p1.isLogined = false;
      p1.hasResult = false;
    } else {
    }
    // Do something with response error
    return Promise.reject(error);
  }
);
// initTesseract
window.Tesseract = Tesseract.create({
  workerPath:
    "file://" + path.join(global.__dirname, "dist/assets/tesseract/worker.js"),
  langPath:
    "file://" + path.join(global.__dirname, "dist/assets/tesseract/langs/"),
  corePath:
    "file://" + path.join(global.__dirname, "dist/assets/tesseract/index.js")
});
// componnents register
const DropDown = Vue.component("drop-down", {
  template: "#dropdown",
  data() {
    return {
      actived: false
    };
  },
  props: {
    field: String,
    items: Array
  },
  methods: {
    openMenu(e) {
      this.actived = true;
      e.stopPropagation();
    },
    selectItem(e, item) {
      this.field = item;
      this.actived = false;
      e.stopPropagation();
    },
    closeMenu(e) {
      this.actived = false;
    }
  }
});
const CheckBox = Vue.component("check-box", {
  template: "#checkbox",
  data() {
    return {};
  },
  methods: {
    toggle() {
      this.checked = !this.checked;
      this.$emit("change", this.checked);
    }
  },
  props: ["checked"]
});
const SelectBox = Vue.component("select-box", {
  template: "#selectbox",
  data() {
    return {};
  },
  props: ["name", "sort", "type"],
  methods: {
    change() {
      this.$emit("change", this.type);
    }
  }
});
var p1 = new Vue({
  el: "#app",
  data: {
    // 识别中
    recognizing: false,
    result: "",
    username: "",
    password: "",
    isLogined: false,
    list: [],
    listBackUp: [], //因为要对list做一些列变化所以保留原始list
    selectedList: [],
    hasResult: false,
    sortBy: "none",
    sort: 0
  },
  mounted() {
    var token;
    if ((token = localStorage.getItem("DN-Token"))) {
      this.isLogined = true;
      axios.defaults.headers.common["Authorization"] = token;
      console.log(axios.defaults.headers);
    } else {
      this.isLogined = false;
    }
  },
  watch: {
    hasResult(newVal, val) {
      var app = document.getElementById("app");
      if (newVal) {
        app.style.height = "840px";
        var win = nw.Window.get();
        win.height = 840;
      } else {
        app.style.height = "100px";
      }
    }
  },
  created() {
    // 监听数组的length属性
    // this.$set(this.selectedList);
    // 给过滤器绑定this,让filters内部可以访问this
    this._f = function(id) {
      return this.$options.filters[id].bind(this._self);
    };
  },
  filters: {
    toDecimal(val, deci) {
      // 判断如果有小数点则四舍五入，没有小数点则保留
      if (/\./.test(val)) {
        return deci != undefined
          ? Number(val.toFixed(deci))
          : Number(val.toFixed(0));
      } else {
        return Number(val);
      }
    },
    toPercent(val) {
      let num = Number(val);
      return num * 100;
    },
    transferProp(val) {
      let result = "";
      if (this.propType[val]) {
        return this.propType[val];
      } else {
        return $t("message.dicom.propOther");
      }
    },
    transferToCal(val) {
      let result = "";
      switch (val) {
        case "400":
          result = "钙化结节";
          break;
        case "600":
          result = "钙化结节";
        default:
          result = "非钙化结节";
      }
      return result;
    }
  },
  methods: {
    login() {
      return axios
        .post(API.login(this.username), {
          password: this.password,
          timeout: LOGIN_TIME_OUT
        })
        .then(data => {
          let token = data.token;
          window.localStorage.setItem("DN-Token", token);
          this.isLogined = true;
          axios.defaults.headers.common["Authorization"] = token;
        })
        .catch(err => {
          alert("账号密码有误");
        });
    },
    hasNoResult() {
      this.toggleSec2(false);
    },
    renderData(detail) {
      if (detail.length > 0) {
        this.hasResult = true;
      } else {
        this.hasResult = false;
        alert("结节数为0");
      }
      // 每一项添加checked为false
      for (let item of detail) {
        item.checked = false;
      }
      this.list = detail;
      this.listBackUp = detail;
    },
    listSort(type) {
      let map = {
        pro: "probability",
        mali: "maligant"
      };
      // 同一个按钮点击排序取反
      if (this.sortBy == type) {
        this.sort = -1 * this.sort;
      } else {
        // 如果没有开始排序，默认从大到小
        this.sort = -1;
      }
      console.log(this.sort);
      switch (this.sort) {
        case 0:
          this.list = this.listBackUp;
          break;
        // 从小到大
        case 1:
          // copy一份
          var copy = this.list.slice(0);
          copy.sort((a, b) => a.lesion[map[type]] - b.lesion[map[type]]);
          this.list = copy;
          break;
        case -1:
          // copy一份
          var copy = this.list.slice(0);
          copy.sort((a, b) => b.lesion[map[type]] - a.lesion[map[type]]);
          this.list = copy;
      }
      this.sortBy = type;
    },
    setList(id) {
      return this.getDetect(id)
        .then(detectId => this.getDetail(detectId))
        .then(detail => this.renderData(detail))
        .catch(e => {
          this.hasResult = false;
        });
    },
    // 先根据patientId或者accessionNumber取得detectId,再根据
    // patientId获取诊断信息
    getDetect(id) {
      console.log(id);
      return axios
        .get(API.list, {
          params: {
            patient_id: id
          }
        })
        .then(data => {
          if (data.mseries.length == 0) {
            alert("无此数据，或者检测失败");
          }
          return data.mseries[0].detect_id;
        });
    },
    getDetail(detectId) {
      return axios.get(API.detect(detectId)).then(data => data);
    },
    // get token for list request
    getToken() {},
    handleSelected(ev, item) {
      item.checked = ev;
      if (ev) {
        this.selectedList.push(item);
      }
      if (!ev) {
        let index = this.selectedList.indexOf(item);
        this.selectedList.splice(index, 1);
      }
      console.log(this.selectedList);
    }
  }
});

// shortcut
const OPTION = {
  key: "Ctrl+X",
  active: search,
  failed: function(msg) {
    // :(, fail to register the |key| or couldn't parse the |key|.
    console.log(msg);
  }
};
const SHORTCUT = new nw.Shortcut(OPTION);
nw.App.registerGlobalHotKey(SHORTCUT);
// open a new fullscreen window
function search() {
  // get screen attribute
  var screens = nw.Screen.screens,
    bounds = screens[0].bounds;
  screenshot("shot.png", (err, complete) => {
    if (err) {
      console.log(err);
    } else {
      var imgPath = path.join(global.__dirname, "./shot.png");
      var imgBuff = fs.readFileSync(imgPath);
      var buffer = Buffer.from(imgBuff);
      var b64 = buffer.toString("base64");
      var ba64 = "data:image/jpeg;base64," + b64;
      window.localStorage.setItem("screenshot64", ba64);
      nw.Window.open("dist/screenshot.html", {
        fullscreen: true,
        frame: false
      });
    }
  });
}

// Node.js eventlistener
const regcognizeEmitter = new EventEmitter();
// 识别成功后调取相应接口
regcognizeEmitter.on("success", id => {
  p1.result = id;
  p1.recognizing = false;
  p1.setList(id);
});
regcognizeEmitter.on("recognizing", ctx => {
  p1.recognizing = true;
  Tesseract.recognize(ctx, {
    lang: "eng",
    tessedit_ocr_engine_mode: 1
  })
    .progress(message => console.log(message))
    .then(result => {
      var text = result.text.replace(/\n/g, "");
      console.log(text);
      global._events.recognition.emit("success", text);
    })
    .finally(resultOrError => console.log(resultOrError));
});
// 识别失败关闭列表下部分
regcognizeEmitter.on("failure", () => {
  p1.hasResult = false;
});
global._events = {
  recognition: regcognizeEmitter
};
