import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class Role extends GraphandModel {
  static apiIdentifier = "roles";

  static baseUrl = "/roles";

  static baseFields = {
    name: new GraphandFieldText({
      name: "Nom",
    }),
  };
}

export default Role;
