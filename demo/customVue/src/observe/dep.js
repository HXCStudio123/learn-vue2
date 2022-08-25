let id = 0;
/**
 * Dep依赖，其实也是被观察者
 * 对在模板中被使用的（能触发get方法）数据，添加一个收集器
 * 收集器上可以存放，当前引用该数据的视图实例，即Watcher
 */
 export default class Dep {
  constructor() {
    this.id = id++;
    this.subs = [];
    // this.subsId = new Set();
  }
  addSub(sub) {
    this.subs.push(sub);
    // if (!this.subsId.has(sub.id)) {
    //   this.subsId.add(sub.id);
    //   this.subs.push(sub);
    //   // sub.add
    // }
  }
  // 给watcher添加当前数据绑定
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }
  notify() {}
}
