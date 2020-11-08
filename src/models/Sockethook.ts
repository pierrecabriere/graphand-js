import GraphandFieldBoolean from "../utils/fields/GraphandFieldBoolean";
import GraphandFieldNumber from "../utils/fields/GraphandFieldNumber";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class Sockethook extends GraphandModel {
  static apiIdentifier = "sockethooks";
  static baseUrl = "/sockethooks";
  static scope = "Sockethook";

  static baseFields = {
    identifier: new GraphandFieldText({ name: "Identifiant unique" }),
    action: new GraphandFieldText({ name: "Action" }),
    path: new GraphandFieldText({ name: "Chemin" }),
    await: new GraphandFieldBoolean({ name: "Attendre le retour" }),
    timeout: new GraphandFieldNumber({ name: "Timeout" }),
    priority: new GraphandFieldNumber({ name: "Priorité", defaultValue: 0 }),
    socket: new GraphandFieldText({ name: "Identifiant du socket" }),
    ip: new GraphandFieldText({ name: "Adresse ip" }),
  };
}

export default Sockethook;
