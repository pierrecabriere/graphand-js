import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class Role extends GraphandModel {
  static apiIdentifier = "roles";
  static baseUrl = "/roles";
  static scope = "Role";

  static baseFields(item) {
    const inherits = new GraphandFieldRelation({
      name: "Rôles parents",
      model: "Role",
      multiple: true,
    });

    if (item?._id) {
      inherits.query = { _id: { $ne: item._id } };
    }

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
      inherits,
      modules: new GraphandFieldRelation({
        name: "Applications",
        model: "Module",
        multiple: true,
      }),
      sidebarModules: new GraphandFieldRelation({
        name: "Applications de la sidebar",
        model: "Module",
        multiple: true,
      }),
      menuModules: new GraphandFieldRelation({
        name: "Applications du menu",
        model: "Module",
        multiple: true,
      }),
    };
  }
}

export default Role;
