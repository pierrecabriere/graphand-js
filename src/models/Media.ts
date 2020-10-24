import FormData from "form-data";
import GraphandFieldBoolean from "../utils/fields/GraphandFieldBoolean";
import GraphandFieldNumber from "../utils/fields/GraphandFieldNumber";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class Media extends GraphandModel {
  static apiIdentifier = "medias";
  static baseUrl = "/medias";
  static scope = "Media";

  static baseFields = {
    name: new GraphandFieldText({ name: "Nom" }),
    description: new GraphandFieldText({ name: "Description" }),
    url: new GraphandFieldText({ name: "Url" }),
    mimetype: new GraphandFieldText({ name: "Mimetype" }),
    originalname: new GraphandFieldText({ name: "Nom original" }),
    size: new GraphandFieldNumber({ name: "Taille" }),
    private: new GraphandFieldBoolean({ name: "Privé", defaultValue: false }),
    width: new GraphandFieldNumber({ name: "Largeur" }),
    height: new GraphandFieldNumber({ name: "Hauteur" }),
  };

  static async beforeCreate(args) {
    if (args.payload?.file?.getAsFile) {
      args.payload.file = args.payload.file.getAsFile();
    }

    const formData = new FormData();
    Object.keys(args.payload).forEach((key) => {
      if (args.payload[key] !== undefined) {
        formData.append(key, args.payload[key]);
      }
    });

    args.config.headers = {
      "Content-Type": "multipart/form-data",
    };

    args.payload = formData;
  }
}

export default Media;
