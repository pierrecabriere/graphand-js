import FormData from "form-data";
import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import GraphandModelPromise from "../lib/GraphandModelPromise";

const defaultLinkOptions = {
  private: false,
  fit: "contain",
};

class Media extends GraphandModel {
  static apiIdentifier = "medias";
  static baseUrl = "/medias";
  static scope = "Media";
  static queryFields = true;

  static universalPrototypeMethods = ["getUrl"];

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

    args.config.params.socket = Math.random().toString(36).substr(2, 9);

    const formData = new FormData();
    Object.keys(args.payload).forEach((key) => {
      if (args.payload[key] !== undefined) {
        formData.append(key, args.payload[key]);
      }
    });

    args.config.headers = formData.getHeaders?.call(formData) || {
      "Content-Type": "multipart/form-data",
    };

    args.payload = formData;
  }

  getUrl(opts: any = {}) {
    opts = Object.assign({}, defaultLinkOptions, opts);
    const client = this instanceof GraphandModelPromise ? this.model._client : Object.getPrototypeOf(this).constructor._client;
    const scope = opts.private ? "private" : "public";
    let url = `https://cdn.graphand.io/${scope}/${client._options.project}/${this._id}?fit=${opts.fit}`;
    if (opts.w > 0) url += `&w=${opts.w}`;
    if (opts.h > 0) url += `&h=${opts.h}`;

    return url;
  }
}

export default Media;
