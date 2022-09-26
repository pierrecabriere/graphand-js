import ModelScopes from "../enums/model-scopes";
import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import GraphandModelPromise from "../lib/GraphandModelPromise";

const defaultLinkOptions = {
  private: false,
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
  static scope = ModelScopes.Media;
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

  name;
  description;
  url;
  mimetype;
  originalname;
  size;
  private;
  width;
  height;
  [prop: string]: any;

  /**
   * {@link Media#getUrl} options
   * @typedef MediaUrlOptions
   * @property w {number=} - Image width
   * @property h {number=} - Image height
   * @property fit {string=} - Image fit (cover|contain)
   * @property stream {string=} - The mimetype to stream the media (need support for buffering)
   */

  /**
   * Get graphand cdn url for current media
   * @param opts {MediaUrlOptions}
   */
  getUrl(opts: any = {}): string {
    opts = Object.assign({}, defaultLinkOptions, opts);
    let client;
    if (this instanceof GraphandModelPromise) {
      client = this.model?._client;
    } else {
      const { constructor } = Object.getPrototypeOf(this);
      client = constructor._client;
    }

    const { private: _private, name, ...data } = opts;

    const scope = _private || this.private ? "private" : "public";
    let url = `${client.getCdnURL()}/${scope}/${client._options.project}/${this._id}`;

    if (name) {
      const _name = typeof name === "string" ? name : this.name;
      url += "/" + encodeURIComponent(_name);
    }

    if (scope === "private") {
      data.token = client.getAccessToken();
    }

    if (Object.keys(data).length) {
      const searchParams = new URLSearchParams(data);
      url = url + `?${searchParams.toString()}`;
    }

    return url;
  }
}

Media.hook("preCreate", (args) => {
  args.config.params.socket = Math.random().toString(36).substr(2, 9);

  if (args.payload && !args.payload.append) {
    if (args.payload?.file?.getAsFile) {
      args.payload.file = args.payload.file.getAsFile();
    }

    const formData = new FormData();
    Object.keys(args.payload).forEach((key) => {
      if (args.payload[key] !== undefined) {
        formData.append(key, args.payload[key]);
      }
    });

    args.config.headers = args.config.headers || {};
    args.config.headers["Content-Type"] = "multipart/form-data";

    args._rawPayload = args.payload;
    args.payload = formData;
  }
});

export default Media;
