import Client from "../Client";
import PluginLifecyclePhases from "../enums/plugin-lifecycle-phases";

const allowedAssign = ["__construct", "onInit"];

class GraphandPlugin {
  options?: any;
  client?: Client;

  constructor(plugin: GraphandPlugin, opts: any, client?: Client) {
    if (typeof plugin === "function") {
      this.__construct = plugin;
      this.options = Object.assign({}, opts);
    } else if (typeof plugin === "object") {
      const { options, ...pluginImplements } = plugin;
      this.options = Object.assign({}, options, opts);

      Object.keys(pluginImplements).forEach((key) => {
        if (!allowedAssign.includes(key)) {
          throw new Error(`GraphandPluginError: attribute ${key} is not allowed in plugin`);
        }
      });

      Object.assign(this, pluginImplements);
    }

    this.client = client;

    this.execute(PluginLifecyclePhases.INSTALL);
  }

  execute?(phase: PluginLifecyclePhases, args: any = {}) {
    args = Object.assign(this.options, args);
    switch (phase) {
      case PluginLifecyclePhases.INSTALL:
        return this.__construct(this.client, args);
      case PluginLifecyclePhases.INIT:
        return this.onInit(this.client, args);
      default:
        return;
    }
  }

  __construct?(client: Client, args: any) {}

  onInit?(client: Client, args: any) {}
}

export default GraphandPlugin;
