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
    };
  }
}

export default Role;
