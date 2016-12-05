import _ from 'lodash';
import React from 'react';
import {Link} from 'react-router';

export const ObjectDisplay = ({object}) => {
  if (object === undefined) {
    return <i className="undefined">undefined</i>;
  }
  else if (object === null) {
    return <b className="null">null</b>;
  }
  else if (Array.isArray(object)) {
    // check for tabular arrays (all of the items are objects with the same keys)
    const items_are_objects = object.every((value) => {
      return (value !== null) && (value !== undefined) && (typeof value === 'object');
    });
    if (object.length > 0 && items_are_objects) {
      // now check that all the keys are the same
      const columns = Object.keys(object[0]);
      const items_have_indentical_keys = object.slice(1).every((value) => {
        return _.isEqual(Object.keys(value), columns);
      });
      if (items_have_indentical_keys) {
        const thead_children = <tr>columns.map(column => <th>{column}</th>)</tr>;
        const tbody_children = object.map((value) => {
          return <tr>columns.map(column => <td><ObjectDisplay object={value[column]} /></td>)</tr>;
        });
        return (
          <div className="table">
            <table>
              <thead>{thead_children}</thead>
              <tbody>{tbody_children}</tbody>
            </table>
          </div>
        );
      }
    }
    // otherwise, it's an array of arbitrary objects
    const array_children = object.map(value => <ObjectDisplay object={value} />);
    return <div className="array">{array_children}</div>;
  }
  else if (typeof object === 'object') {
    const object_children = _.map(object, (value, key) => {
      return <tr><td>{key}</td><td><ObjectDisplay object={value} /></td></tr>;
    });
    return <div className="object"><table className="keyval">{object_children}</table></div>;
  }
  else if (typeof object === 'number') {
    return <b className="number">{object.toString()}</b>;
  }
  else if (typeof object === 'boolean') {
    return <b className="boolean">{object.toString()}</b>;
  }
  return <span className="string">{object.toString()}</span>;
};

export class NavLink extends React.Component {
  render() {
    return <Link {...this.props} activeClassName="current" />;
  }
}

export class TemplateSelect extends React.Component {
  componentDidMount() {
    fetch('/api/templates/').then(templates => {
      this.setState({templates});
    });
  }
  render() {
    const {templates = []} = this.state;
    return (
      <select>
        {templates.map(template => <option value={template.id}>{template.name}</option>)}
      </select>
    );
  }
}

export class TemplateLink extends React.Component {
  componentDidMount() {
    const {id} = this.props;
    fetch(`/api/templates/${id}`).then(template => {
      this.setState({template});
    });
  }
  render() {
    const {id} = this.props;
    const {template} = this.state;
    return <Link to={`/admin/templates/edit/${id}`}>{template.name}</Link>;
  }
}
