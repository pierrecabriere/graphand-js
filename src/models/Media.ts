import ModelEnvScopes from "../enums/model-env-scopes";
import ModelScopes from "../enums/model-scopes";
import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import GraphandModelPromise from "../lib/GraphandModelPromise";
import isId from "../utils/isId";

const defaultUrlOptions = {
  private: false,
};

type MediaUrlOptions = {
  w?: number;
  h?: number;
  fit?: "cover" | "contain";
  stream?: string | boolean;
  name?: string | boolean;
  private?: boolean;
};

/**
 * @class Media
 * @augments GraphandModel
 * @classdesc Media model. Use {@link GraphandClient#getModel client.getModel("Media")} to use this model
 */
class Media extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "medias";
  static baseUrl = "/medias";
  static scope = ModelScopes.Media;
  static envScope = ModelEnvScopes.PROJECT;
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
    duration: new GraphandFieldNumber(),
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
  duration;
  [prop: string]: any;

  /**
   * {@link Media#getUrl} options
   * @typedef MediaUrlOptions
   * @property w {number=} - Image width
   * @property h {number=} - Image height
   * @property fit {string=} - Image fit (cover|contain)
   * @property stream {string|boolean=} - The mimetype to stream the media (need support for buffering). If true, media needs to be resolved
   * @property name {string|boolean=} - The name added to the url. If true, media needs to be resolved
   * @property private {boolean=} - Specify if the media is private or not. If not specified, media needs to be resolved to be private
   */

  /**
   * Get graphand cdn url for current media
   * @param opts {MediaUrlOptions}
   */
  getUrl(opts: MediaUrlOptions = {}): string {
    opts = Object.assign({}, defaultUrlOptions, opts);
    let client;
    if (this instanceof GraphandModelPromise) {
      client = this.model?._client;
    } else {
      const { constructor } = Object.getPrototypeOf(this);
      client = constructor._client;
    }

    const { private: _private, name, ..._data } = opts;
    const data = _data as any;

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

  /**
   * Decode graphand media url to get media and options from url
   * @param url {string}
   */
  static decodeUrl(url: string): [media: GraphandModelPromise<Media> | Media, opts: MediaUrlOptions] | null {
    const client = this._client;

    if (!client) {
      return null;
    }

    const regex = new RegExp(`^${client.getCdnURL()}\/(private|public)\/(\\w+)\/(\\w+)(\/(.+?))?(\\?(.+?))?$`);
    const match = url.match(regex);
    if (!match) {
      return null;
    }

    const { 1: scope, 2: projectId, 3: mediaId, 5: mediaName, 6: urlParams } = match;

    if (projectId !== client._options.project || !isId(mediaId)) {
      return null;
    }

    const opts: MediaUrlOptions = {};
    opts.private = scope === "private";
    opts.name = mediaName;

    if (urlParams?.length) {
      const urlSearchParams = new URLSearchParams(urlParams);
      opts.w = parseInt(urlSearchParams.get("w"));
      opts.h = parseInt(urlSearchParams.get("h"));
      const fit = urlSearchParams.get("fit");
      opts.fit = fit === "contain" ? "contain" : "cover";
    }

    return [this.get(mediaId), opts];
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
