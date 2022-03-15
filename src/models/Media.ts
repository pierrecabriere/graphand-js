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
  static _customFields = {};

  static apiIdentifier = "medias";
  static baseUrl = "/medias";
  static scope = "Media";
  static queryFields = true;
  static schema = {
    name: new GraphandFieldText(),
    description: new GraphandFieldText(),
    url: new GraphandFieldText(),
    mimetype: new GraphandFieldText(),
    originalname: new GraphandFieldText(),
    size: new GraphandFieldNumber(),
    private: new GraphandFieldBoolean({ defaultValue: false }),
    width: new GraphandFieldNumber(),
    height: new GraphandFieldNumber(),
  };

  static universalPrototypeMethods = ["getUrl"];

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
    // @ts-ignore
    const client = this instanceof GraphandModelPromise ? this.model._client : Object.getPrototypeOf(this).constructor._client;
    const scope = opts.private ? "private" : "public";
    let url = `https://cdn.graphand.io/${scope}/${client._options.project}/${this._id}?fit=${opts.fit}`;
    if (opts.w > 0) url += `&w=${opts.w}`;
    if (opts.h > 0) url += `&h=${opts.h}`;

    return url;
  }
}

export default Media;
