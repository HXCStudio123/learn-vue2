import Vue from "vue";
console.log(1);
new Vue({
  el: "#app",
  // data: {
  //   firstName: 'John',
  //   lastName: 'Joe',
  //   reverseFirstName: 'John'.split('').reverse().join('')
  // },
  data() {
    return {
      msg: 1,
      firstName: "John",
      lastName: "Joe",
      reverseFirstName: "John".split("").reverse().join(""),
    };
  },
  components: {
    custom: {
      data: {
        firstName: "11",
      },
      template: "<div>111</div>",
    },
  },
  computed: {
    fullName() {
      return this.firstName + this.lastName;
    },
  },
  watch: {
    firstName(val) {
      this.reverseFirstName = val.split("").reverse().join("");
    },
  },
  created() {
    this.$once("test", cb1);
    // this.$on("test", () => {
    //   console.log("测试挂载2");
    // });
    // this.$on("test", () => {
    //   console.log("测试挂载3");
    // });
  },
  mounted() {
    console.log(this.$refs.firstDom);
  },
  methods: {
    reset() {
      this.firstName = "John";
    },
    test() {
      console.log("11");
      this.$emit("test");
      // this.$off('test', () => {
      //   console.log("测试挂载2");
      // });
    },
  },
});
function cb1() {
  console.log("测试挂载1");
}
