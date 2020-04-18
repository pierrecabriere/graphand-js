import isEqual from "fast-deep-equal/react";
import React from "react";
import { createStore } from "redux";
import GraphandModel from "./GraphandModel";

class ConnectedComponent extends React.Component {
  baseQuery = null;
  query = null;
  unsubscribe;

  constructor(props) {
    super(props);

    this.state = {
      list: props.__connectConfig.model.getList(),
      initialized: false,
      loading: false,
      query: {},
      data: null,
      lastUpdate: null,
      error: null,
    };

    this.unsubscribe = props.__connectConfig.model.store.subscribe(() => {
      const list = props.__connectConfig.model.getList();
      if (!isEqual(this.state.list, list)) {
        this.setState({ list });
      }
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.initialized && this.state.list.length !== nextState.list.length) {
      this.updateData();
    }

    let shouldUpdate = !isEqual({ ...this.state, data: undefined, list: undefined }, { ...nextState, data: undefined, list: undefined });

    if (!shouldUpdate && Object.keys(this.props).length && Object.keys(nextProps).length) {
      const ignoredKeys = ["history", "location", "match", "__proto__", "user", "staticContext", "__connectConfig"];
      const clean = (props) => {
        const _props = { ...props };
        Object.keys(_props).forEach((key) => {
          if (ignoredKeys.includes(key) || _props[key] instanceof GraphandModel || typeof _props[key] === "function") {
            delete _props[key];
          }
        });

        return _props;
      };
      shouldUpdate = !isEqual(clean(this.props), clean(nextProps));
    }

    if (!shouldUpdate) {
      shouldUpdate = !isEqual(this.getList(), this.getList(nextState));
    }

    return shouldUpdate;
  }

  componentWillUnmount() {
    this.unsubscribe && this.unsubscribe();
  }

  getQuery = () => {
    let { query } = this.state;

    query =
      JSON.parse(JSON.stringify(query), (key, value) => {
        if (value !== undefined && JSON.stringify(value) !== "{}") {
          return value;
        }
      }) || {};

    if (this.baseQuery && this.baseQuery.query && (Object.keys(this.baseQuery).length > 1 || Object.keys(this.baseQuery.query).length)) {
      const baseQuery =
        query.query && Object.keys(this.baseQuery.query).length ? { $and: [this.baseQuery.query, query.query] } : query.query || this.baseQuery.query;
      query = Object.assign(query, this.baseQuery);
      query.query = baseQuery;
    }

    query =
      JSON.parse(JSON.stringify(query), (key, value) => {
        if (value !== undefined && JSON.stringify(value) !== "{}") {
          return value;
        }
      }) || {};

    return query;
  };

  updateData = async (cache = this.props.__connectConfig.cache, waitRequest = false) => {
    const query = this.getQuery();

    this.setState({ error: null, loading: true });

    try {
      const data = await this.props.__connectConfig.model._connectConfig.fetch(query, !!cache, !!waitRequest, async (res) => {
        if (res === false) {
          if (!this.state.loading) {
            this.setState({ loading: true });
          }

          const _res = await this.props.__connectConfig.model._connectConfig.fetch(query, true, true);
          this.setState({
            data: _res,
            lastUpdate: new Date(),
            loading: false,
          });
        } else if (this.state.loading) {
          this.setState({ loading: false });
        }
      });

      await new Promise((resolve) => {
        this.setState({ data, lastUpdate: new Date(), initialized: true }, resolve);
      });

      setTimeout(() => {
        if (this.state.loading) {
          this.setState({ loading: false });
        }
      }, 1000);
    } catch (error) {
      this.setState({ error, initialized: true, loading: false });
    }

    return this.getList();
  };

  update = async (query = this.state.query, updateData = true, ...opts) => {
    if (typeof query === "string") {
      query = { query: { _id: query } };
    } else if (!query) {
      query = {};
    }

    return new Promise((resolve) => {
      this.setState({ query }, async () => {
        const list = updateData ? await this.updateData(...opts) : this.getList();
        resolve(list);
      });
    });
  };

  setBaseQuery = (query) => {
    if (typeof query === "string") {
      query = { query: { _id: query }, pageSize: 1, page: 1 };
    } else if (!query) {
      query = {};
    }

    this.baseQuery = query;
  };

  getBaseQuery = () => {
    return this.baseQuery;
  };

  reinit = (query = this.state.query) => {
    this.setState({
      initialized: false,
      loading: false,
      data: null,
      error: null,
    });
    return this.update(query);
  };

  getList = (state = this.state) => {
    if (!state.list) {
      return [];
    }

    const list = this.props.__connectConfig.mapDataToList(state.data);

    return list && list.map((item) => this.props.__connectConfig.find(state.list, item)).filter((item) => item);
  };

  render() {
    const props = {
      ...this.props,
      [this.props.__connectConfig.name]: {
        __connected: true,
        data: this.state.data || {},
        query: this.state.query,
        getQuery: this.getQuery,
        loading: this.state.loading,
        error: this.state.error,
        initialized: this.state.initialized,
        lastUpdate: this.state.lastUpdate,
        update: this.update,
        reinit: this.reinit,
        setBaseQuery: this.setBaseQuery,
        getBaseQuery: this.getBaseQuery,
        forceUpdate: this.forceUpdate,
        list: this.getList(),
      },
    };

    return React.createElement(this.props.__connectConfig.component, props);
  }
}

class ConnectableModel {
  static connectConfig = {};

  static get _connectConfig() {
    const config = {
      find: (list, item) => list.find((i) => i._id === item._id),
      fetch: () => null,
      mapDataToList: (data) => data,
      ...this.connectConfig,
    };
    config.fetch = config.fetch.bind(this);
    return config;
  }

  static get store() {
    if (!this._connectConfig) {
      throw new Error("Please provide a valid _connectConfig object.");
    }

    if (!this._store) {
      const _upsert = (state, item) => {
        const found = this._connectConfig.find(state.list, item);
        if (found) {
          return {
            ...state,
            list: state.list.map((i) => (i === found ? item : i)),
          };
        }

        return { ...state, list: [...state.list, item] };
      };
      const _update = (state, item, payload) => {
        const found = this._connectConfig.find(state.list, item);
        if (found) {
          return {
            ...state,
            list: state.list.map((i) => {
              if (i === found) {
                Object.assign(i, payload);
              }

              return i;
            }),
          };
        }

        return state;
      };
      const _delete = (state, item) => {
        const found = this._connectConfig.find(state.list, item);
        return { ...state, list: [...state.list.filter((i) => i !== found)] };
      };

      this._store = createStore((state = { list: [] }, { type, target, payload }) => {
        switch (type) {
          case "UPSERT":
            if (Array.isArray(payload)) {
              payload.forEach((item) => (state = _upsert(state, item)));
            } else {
              state = _upsert(state, payload);
            }

            return state;
          case "UPDATE":
            if (target) {
              state = _update(state, target, payload);
            }

            return state;
          case "DELETE":
            state = _delete(state, payload);

            return state;
          case "REINIT":
            return { list: [] };
          default:
            return state;
        }
      });
    }

    return this._store;
  }

  static reinitStore() {
    this.store.dispatch({
      type: "REINIT",
    });

    return this;
  }

  static getList() {
    return this.store.getState().list;
  }

  static deleteFromStore(payload) {
    this.store.dispatch({
      type: "DELETE",
      payload,
    });
  }

  static upsertStore(payload) {
    this.store.dispatch({
      type: "UPSERT",
      payload,
    });
  }

  static updateStore(target, payload) {
    this.store.dispatch({
      type: "UPDATE",
      target,
      payload,
    });
  }

  static connect(name, params = {}) {
    return (Component) => {
      const defaultConfig = {
        mapDataToList: this._connectConfig.mapDataToList,
        find: this._connectConfig.find,
        cache: true,
      };

      const config = { ...defaultConfig, ...params };

      return (props) =>
        React.createElement(ConnectedComponent, { ...props, __connectConfig: { ...config, name, model: this, component: Component } });
    };
  }
}

export default ConnectableModel;
