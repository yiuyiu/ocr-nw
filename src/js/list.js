var DropDown = Vue.component("drop-down", {
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
var CheckBox = Vue.component("check-box", {
  template: "#checkbox",
  data() {
    return {
      checked: false
    };
  },
  methods: {
    toggle() {
      this.checked = !this.checked;
      this.$emit("change", this.checked);
    }
  }
});
var vm = new Vue({
  el: "#app",
  data() {
    return {
      list: [],
      selectedList: [],
      xixi: false
    };
  },
  watch: {
    xixi(newVal, val) {
      console.log(newVal);
    }
  },
  components: {
    DropDown
  },
  methods: {
    handleSelected(e) {
      console.log(e);
    }
  }
});
