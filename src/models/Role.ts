import GraphandFieldBoolean from "../utils/fields/GraphandFieldBoolean";
import GraphandFieldRelation from "../utils/fields/GraphandFieldRelation";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class Role extends GraphandModel {
  static apiIdentifier = "roles";

  static baseUrl = "/roles";

  static get baseFields() {
    return {
      name: new GraphandFieldText({
        name: "Nom",
      }),
      description: new GraphandFieldText({
        name: "Description",
      }),
      admin: new GraphandFieldBoolean({
        name: "Administrateur",
      }),
      modules: new GraphandFieldRelation({
        name: "Applications",
        model: this._client.models.Module,
        multiple: true,
      }),
      sidebarModules: new GraphandFieldRelation({
        name: "Applications de la sidebar",
        model: this._client.models.Module,
        multiple: true,
      }),
      menuModules: new GraphandFieldRelation({
        name: "Applications du menu",
        model: this._client.models.Module,
        multiple: true,
      }),

      // description: String,
      // admin: { type: Boolean, default: false },
      // accessBackoffice: { type: Boolean, default: true },
      // modules: [
      //   {
      //     type: mongoose.Schema.Types.ObjectId,
      //     ref: "Module",
      //   },
      // ],
      // sidebarModules: [
      //   {
      //     type: mongoose.Schema.Types.ObjectId,
      //     ref: "Module",
      //   },
      // ],
      // menuModules: [
      //   {
      //     type: mongoose.Schema.Types.ObjectId,
      //     ref: "Module",
      //   },
      // ],
      // modulesConfigurations: [
      //   new mongoose.Schema(
      //     {
      //       module: {
      //         type: mongoose.Schema.Types.ObjectId,
      //         ref: "Module",
      //       },
      //       configuration: {
      //         type: String,
      //         set: (v) => {
      //           try {
      //             return JSON.stringify(v);
      //           } catch {
      //             return "";
      //           }
      //         },
      //         get: (v) => {
      //           try {
      //             return JSON.parse(v);
      //           } catch {
      //             return {};
      //           }
      //         },
      //       },
      //     },
      //     {
      //       toJSON: { getters: true },
      //       toObject: { getters: true },
      //     },
      //   ),
      // ],
    };
  }
}

export default Role;
