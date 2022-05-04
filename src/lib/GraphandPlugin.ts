import Client from "../Client";
import PluginLifecyclePhases from "../enums/plugin-lifecycle-phases";

export type GraphandPluginOptions = any;

/**
 * @class GraphandPlugin
 * @classdesc Base Plugin class. You can extend this class to create your own plugins
 */
class GraphandPlugin<T extends GraphandPluginOptions> {
  static LifecyclePhases = PluginLifecyclePhases;
  static defaultOptions: GraphandPluginOptions = {};

  client: Client;
  options: T & any;

  constructor(client: Client, options: Partial<T> = {}) {
    const { constructor } = Object.getPrototypeOf(this);

    this.client = client;
    this.options = Object.assign({}, constructor.defaultOptions, options);

    this.execute(PluginLifecyclePhases.INSTALL);
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
