import PluginLifecyclePhases from "../enums/plugin-lifecycle-phases";
import GraphandClient from "../GraphandClient";

export type GraphandPluginOptions = any;

/**
 * @class GraphandPlugin
 * @classdesc Base Plugin class. You can extend this class to create your own plugins
 */
class GraphandPlugin<T extends GraphandPluginOptions = any> {
  static LifecyclePhases = PluginLifecyclePhases;
  static defaultOptions: GraphandPluginOptions = {};

  static registeredOptions: any;
  client: GraphandClient;
  options: T;

  constructor(options?: T) {
    const { constructor } = Object.getPrototypeOf(this);

    this.options = Object.assign({}, constructor.defaultOptions, options);
  }

  install(client: GraphandClient) {
    this.client = client;
    this.execute(PluginLifecyclePhases.INSTALL);
    return this;
  }

  onInstall(): void {
    return;
  }

  onInit(): void {
    return;
  }

  onUninstall(): void {
    return;
  }

  execute?(phase: PluginLifecyclePhases) {
    if (!this.client) {
      throw new Error(`Please use Plugin.prototype.install(client) before execute`);
    }

    switch (phase) {
      case PluginLifecyclePhases.INSTALL:
        return this.onInstall();
      case PluginLifecyclePhases.INIT:
        return this.onInit();
      case PluginLifecyclePhases.UNINSTALL:
        return this.onUninstall();
      default:
        return;
    }
  }
}

export default GraphandPlugin;
