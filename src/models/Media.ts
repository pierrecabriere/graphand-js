import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import GraphandModelPromise from "../lib/GraphandModelPromise";

const defaultLinkOptions = {
  private: false,
  fit: "contain",
};

/**
 * @class Media
 * @augments GraphandModel
 * @classdesc Media model. Use {@link Client#getModel client.getModel("Media")} to use this model
 */
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

  static _universalPrototypeMethods = ["getUrl"];

  /**
   * {@link Media#getUrl} options
   * @typedef MediaUrlOptions
   * @property w {number=} - Image width
   * @property h {number=} - Image height
   * @property fit {string=} - Image fit (cover or contain)
   */

  /**
   * Get graphand cdn url for current media
   * @param opts {MediaUrlOptions}
   */
  getUrl(opts: any = {}) {
    opts = Object.assign({}, defaultLinkOptions, opts);
    let client;
    if (this instanceof GraphandModelPromise) {
      const promise = this as unknown as GraphandModelPromise;
      client = promise.model?._client;
    } else {
      const { constructor } = Object.getPrototypeOf(this);
      client = constructor._client;
    }

    const scope = opts.private ? "private" : "public";
    let url = `https://cdn.graphand.io/${scope}/${client._options.project}/${this._id}?fit=${opts.fit}`;
    if (opts.w > 0) url += `&w=${opts.w}`;
    if (opts.h > 0) url += `&h=${opts.h}`;

    return url;
  }
}

Media.hook("preCreate", (args) => {
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

  args.config.headers = args.config.headers || {};
  args.config.headers["Content-Type"] = "multipart/form-data";

  args.payload = formData;
});

export default Media;
