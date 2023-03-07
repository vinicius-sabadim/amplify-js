import { ConsoleLogger as LoggerClass } from './Logger';

const logger = new LoggerClass('Amplify');

export class AmplifyClass {
	// Everything that is `register`ed is tracked here
	private _components: any[] = [];
	private _config = {};

	// All modules (with `getModuleName()`) are stored here for dependency injection
	private _modules: Record<string, any> = {};

	// for backward compatibility to avoid breaking change
	// if someone is using like Amplify.Auth
	// TODO: find better types after PoC
	Auth: any = null;
	Analytics: any = null;
	API: any = null;
	Credentials: any = null;
	Storage: any = null;
	I18n: any = null;
	Cache: any = null;
	PubSub: any = null;
	Interactions: any = null;
	Pushnotification: any = null;
	UI: any = null;
	XR: any = null;
	Predictions: any = null;
	DataStore: any = null;
	Geo: any = null;
	Notifications: any = null;

	Logger = LoggerClass;
	ServiceWorker = null;

	register(comp) {
		logger.debug('component registered in amplify', comp);
		this._components.push(comp);
		if (typeof comp.getModuleName === 'function') {
			this._modules[comp.getModuleName()] = comp;
			this[comp.getModuleName()] = comp;
		} else {
			logger.debug('no getModuleName method for component', comp);
		}

		// Finally configure this new component(category) loaded
		// With the new modularization changes in Amplify V3, all the Amplify
		// component are not loaded/registered right away but when they are
		// imported (and hence instantiated) in the client's app. This ensures
		// that all new components imported get correctly configured with the
		// configuration that Amplify.configure() was called with.
		comp.configure(this._config);
	}

	configure(config?) {
		if (!config) return this._config;

		this._config = Object.assign(this._config, config);
		logger.debug('amplify config', this._config);

		// Dependency Injection via property-setting.
		// This avoids introducing a public method/interface/setter that's difficult to remove later.
		// Plus, it reduces `if` statements within the `constructor` and `configure` of each module
		Object.entries(this._modules).forEach(([Name, comp]) => {
			// e.g. Auth.*
			Object.keys(comp).forEach(property => {
				// e.g. Auth["Credentials"] = this._modules["Credentials"] when set
				if (this._modules[property]) {
					comp[property] = this._modules[property];
				}
			});
		});

		this._components.map(comp => {
			comp.configure(this._config);
		});

		return this._config;
	}

	addPluggable(pluggable) {
		if (
			pluggable &&
			pluggable['getCategory'] &&
			typeof pluggable['getCategory'] === 'function'
		) {
			this._components.map(comp => {
				if (
					comp['addPluggable'] &&
					typeof comp['addPluggable'] === 'function'
				) {
					comp.addPluggable(pluggable);
				}
			});
		}
	}
}

export const Amplify = new AmplifyClass();
