const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const OauthContext = require('./contexts/Oauth');
const SelectedAppContext = require('./contexts/SelectedApp');
const VariablesContext = require('./contexts/Variables');

class Variable extends React.Component {
  constructor(props) {
    super(props);
    this.state = { showDropdown: false };

    this.getName = this.getName.bind(this);
    this.toggleVarDropdown = this.toggleVarDropdown.bind(this);
    this.toggleAuthDropdown = this.toggleAuthDropdown.bind(this);
    this.renderVarDropdown = this.renderVarDropdown.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  onChange(event) {
    this.toggleVarDropdown();
    this.props.changeSelected(event.target.value);
  }

  getName() {
    const name = this.props.name || this.props.variable;
    if (!name) throw new TypeError("Missing prop 'name' or 'variable' for Variable component!");

    return name;
  }

  getDefault() {
    const def = this.props.defaults.filter(Boolean).find(d => d.name === this.getName()) || {};

    if (def.default) return def.default;
    return this.getName().toUpperCase();
  }

  getSelectedValue(selected) {
    const { user } = this.props;
    let selectedValue = {};
    if (Array.isArray(user.keys) && user.keys.length) {
      selectedValue = selected ? user.keys.find(key => key.name === selected) : user.keys[0];
    }
    return selectedValue;
  }

  // Determining whether to show a dropdown or not onClick
  // based upon whether the currently displayed value has come
  // from one of the nested user.keys[] or not.
  // Additionally do not show the dropdown if there is only a
  // single key, since there's nothing to change it to.
  shouldShowVarDropdown(selected) {
    const { user } = this.props;

    return !!this.getSelectedValue(selected)[this.getName()] && Array.isArray(user.keys) && user.keys.length > 1;
  }

  // Return value in this order
  // - selected user keys value (or first user keys)
  // - top level user value
  // - default value
  // - uppercase key
  getValue(selected) {
    const selectedValue = this.getSelectedValue(selected);

    const value = selectedValue[this.getName()] || this.props.user[this.getName()] || this.getDefault();

    return typeof value === 'object' ? JSON.stringify(value) : value;
  }

  toggleVarDropdown() {
    if (!this.shouldShowVarDropdown()) return;
    this.setState(prevState => ({ showDropdown: !prevState.showDropdown }));
  }

  toggleAuthDropdown() {
    this.setState(prevState => ({ showAuthDropdown: !prevState.showAuthDropdown }));
  }

  static renderAuthDropdown() {
    return (
      <div
        className={classNames('ns-popover-dropdown-theme', 'ns-popover-bottom-placement', 'ns-popover-right-align')}
        style={{ position: 'absolute' }}
      >
        <div className="ns-popover-tooltip" id="loginDropdown">
          <div className="ns-triangle" />
          <div className="triangle" />
          <div className="pad">
            <div className="text-center">
              Authenticate to personalize this page
              <a className={classNames('btn', 'btn-primary')} href="/oauth" target="_self">
                Authenticate
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderVarDropdown() {
    return (
      <select onChange={this.onChange} value={this.props.selected}>
        {this.props.user.keys.map(key => (
          <option key={key.name} value={key.name}>
            {key.name}
          </option>
        ))}
      </select>
    );
  }

  render() {
    const { user, selected } = this.props;

    if (Array.isArray(user.keys) && user.keys.length) {
      return (
        <span>
          {!this.state.showDropdown && (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            <span className="variable-underline" onClick={this.toggleVarDropdown}>
              {this.getValue(selected)}
            </span>
          )}
          {this.state.showDropdown && this.renderVarDropdown()}
        </span>
      );
    }

    // If default is shown and project has oauth, display login dropdown
    if (this.getValue() === this.getDefault() && this.props.oauth) {
      return (
        <span>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <span className="variable-underline" onClick={this.toggleAuthDropdown}>
            {this.getValue()}
          </span>
          {this.state.showAuthDropdown && Variable.renderAuthDropdown()}
        </span>
      );
    }

    return <span>{this.getValue()}</span>;
  }
}

Variable.propTypes = {
  changeSelected: PropTypes.func.isRequired,
  defaults: PropTypes.arrayOf(PropTypes.shape({ default: PropTypes.string, name: PropTypes.string })).isRequired,
  name: PropTypes.string,
  oauth: PropTypes.bool,
  selected: PropTypes.string.isRequired,
  user: PropTypes.shape({
    keys: PropTypes.array,
  }).isRequired,
  variable: PropTypes.string,
};

Variable.defaultProps = {
  oauth: false,
};

/* istanbul ignore next */
// eslint-disable-next-line react/display-name
module.exports = props => (
  <VariablesContext.Consumer>
    {({ user, defaults }) => (
      <OauthContext.Consumer>
        {oauth => (
          <SelectedAppContext.Consumer>
            {({ selected, changeSelected }) => (
              <Variable
                {...props}
                changeSelected={changeSelected}
                defaults={defaults}
                oauth={oauth}
                selected={selected}
                user={user}
              />
            )}
          </SelectedAppContext.Consumer>
        )}
      </OauthContext.Consumer>
    )}
  </VariablesContext.Consumer>
);

module.exports.Variable = Variable;

// Regex to match the following:
// - \<<apiKey\>> - escaped variables
// - <<apiKey>> - regular variables
// - <<glossary:glossary items>> - glossary
module.exports.VARIABLE_REGEXP = /(?:\\)?<<((?:(?![\r\n])[-_\p{L}:.\s\d])+)(?:\\)?>>/iu.source;
// copied from here: https://stackoverflow.com/a/6926184
module.exports.MDX_VARIABLE_REGEXP =
  /(\\)?\{user.[$_\p{L}][$_\p{L}\p{Mn}\p{Mc}\p{Nd}\p{Pc}\u200C\u200D]*(\\)?\}/iu.source;
module.exports.VariablesContext = VariablesContext;
module.exports.SelectedAppContext = SelectedAppContext;
