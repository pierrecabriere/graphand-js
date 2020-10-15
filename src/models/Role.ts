import GraphandFieldBoolean from "../utils/fields/GraphandFieldBoolean";
import GraphandFieldNumber from "../utils/fields/GraphandFieldNumber";
import GraphandFieldRelation from "../utils/fields/GraphandFieldRelation";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class Role extends GraphandModel {
  static apiIdentifier = "roles";
  static baseUrl = "/roles";
  static scope = "Role";

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
      level: new GraphandFieldNumber({
        name: "Niveau",
        options: {
          helper:
            "Les utilisateurs ne pourront pas créer ou modifier des utilisateurs dont le niveau de rôle est inférieur au leur. Le rôle administrateur est de niveau 0",
        },
      }),
      inherits: new GraphandFieldRelation({
        name: "Rôles parents",
        model: this._client.models.Role,
        multiple: true,
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
