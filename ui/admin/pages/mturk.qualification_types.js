import React from 'react';

export class QualificationTypeTable extends React.Component {
  render() {
    return (
      <div>
        <section className="hpad">
          <h3>Qualification Types</h3>
          <a ui-sref="admin.mturk.qualification_types.new">Create new Qualification Type</a>
        </section>

        <section className="box hpad">

          <label>
            <div><b>Query</b>
              <span className="help">A text query against all of the searchable attributes of Qualification types.</span>
            </div>
            <input ng-model="SearchQualificationTypes.Query" />
          </label>

          <label>
            <div><b>SortDirection</b>
              <span className="help">A text query against all of the searchable attributes of Qualification types.</span>
            </div>
            <select ng-model="SearchQualificationTypes.SortDirection">
              <option value="Ascending">Ascending</option>
              <option value="Descending">Descending</option>
            </select>
          </label>

          <label>
            <div><b>Page Size</b>
              <span className="help">The number of Qualification types to include in a page of results. The operation divides the complete sorted result set into pages of this many Qualification types.</span>
            </div>
            <input type="number" min="1" max="100" ng-model="SearchQualificationTypes.PageSize" />
          </label>

          <label>
            <div><b>Page Number</b>
              <span className="help">The page of results to return. After the operation filters, sorts, and divides the Qualification types into pages of size PageSize, it returns page corresponding to PageNumber as the results of the operation.</span>
            </div>
            <input type="number" min="1" ng-model="SearchQualificationTypes.PageNumber" />
          </label>

          <label>
            <div>
              <input type="checkbox" ng-model="SearchQualificationTypes.MustBeRequestable" />
              <b>Must Be Requestable</b>
              <span className="help">Specifies that only Qualification types that a user can request through the Amazon Mechanical Turk web site, such as by taking a Qualification test, are returned as results of the search. Some Qualification types, such as those assigned automatically by the system, cannot be requested directly by users. If false, all Qualification types, including those managed by the system, are considered for the search.</span>
            </div>
          </label>

          <label>
            <div>
              <input type="checkbox" ng-model="SearchQualificationTypes.MustBeOwnedByCaller" />
              <b>Must Be Owned By Caller</b>
              <span className="help">Specifies that only Qualification types that the Requester created are returned. If false, the operation returns all Qualification types.</span>
            </div>
          </label>

        </section>


        <section ng-if="QualificationTypes.length === 0" className="hpad">
          <p>No Qualification Types could be found.</p>
        </section>
        <section className="box">
          <table className="striped lined padded fill">
            <thead>
              <tr>
                <th>QualificationTypeId</th>
                <th>CreationTime</th>
                <th>Name</th>
                <th>Description</th>
                <th>Keywords</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr ng-repeat="QualificationType in QualificationTypes">
                <td><a ui-sref="admin.mturk.qualification_types.edit({QualificationTypeId: QualificationType.QualificationTypeId})">{QualificationType.QualificationTypeId}</a></td>
                <td><time>{QualificationType.CreationTime | date:"yyyy-MM-dd"}</time></td>
                <td>{QualificationType.Name}</td>
                <td>{QualificationType.Description}</td>
                <td>{QualificationType.Keywords}</td>
                <td>{QualificationType.QualificationTypeStatus}</td>
                <td>
                  <button ng-click="delete(QualificationType)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    );
  }
}

export class QualificationTypeEdit extends React.Component {
  render() {
    return (
      <div>
        <label className="block" ng-hide="QualificationType.QualificationTypeId">
          <div><b>Name</b>
            <span className="help">The name of the Qualification type. The type name is used to represent the Qualification to Workers, and to find the type using a Qualification type search.</span>
          </div>
          <input type="text" ng-model="QualificationType.Name" style="width: 500px" />{/* required */}
        </label>

        <label className="block">
          <div><b>Description</b>
            <span className="help">A long description for the Qualification type. On the Amazon Mechanical Turk website, the long description is displayed when a Worker examines a Qualification type. 2000 character maximum.</span>
          </div>
          <textarea ng-model="QualificationType.Description" rows="2" style="width: 500px" /></textarea> {/* required */}
        </label>

        <label className="block" ng-hide="QualificationType.QualificationTypeId">
          <div><b>Keywords</b>
            <span className="help">One or more words or phrases that describe the Qualification type, separated by commas. The keywords of a type make the type easier to find during a search.</span>
          </div>
          <input type="text" ng-model="QualificationType.Keywords" style="width: 500px" />
        </label>

        <label className="block">
          <div><b>Retry Delay (e.g., 60m)</b>
            <span className="help">The amount of time that a Worker must wait after requesting a Qualification of the Qualification type before the worker can retry the Qualification request.</span>
          </div>
          <input type="text" ng-model="QualificationType.RetryDelayInSeconds" duration-string />
        </label>

        <label className="block">
          <div><b>Status</b>
            <span className="help">The initial status of the Qualification type.</span>
          </div>
          <select ng-model="QualificationType.QualificationTypeStatus"> {/* required */}
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>

        <label className="block">
          <div><b>Test</b>
            <span className="help">The questions for the Qualification test a Worker must answer correctly to obtain a Qualification of this type, in the form of a QuestionForm data structure. Must not be be specified if <code>Auto Granted</code> is checked.</span>
          </div>
          <span><i>Not yet implemented.</i></span>
        </label>

        <label className="block" ng-show="QualificationType.Test">
          <div><b>Test Duration</b>
            <span className="help">The amount of time the Worker has to complete the Qualification test, starting from the time the Worker requests the Qualification. Required if the Test parameter is specified.</span>
          </div>
          <input type="text" ng-model="QualificationType.TestDuration" />
        </label>

        <label className="block" ng-show="QualificationType.Test">
          <div><b>AnswerKey</b>
            <span className="help">The answers to the Qualification test specified in the Test parameter, in the form of an AnswerKey data structure.</span>
          </div>
          <span><i>Not yet implemented.</i></span>
        </label>

        <label className="block">
          <div>
            <input type="checkbox" ng-model="QualificationType.AutoGranted" ng-true-value="1" ng-false-value="0" />
            <b>Auto Granted</b>
            <span className="help">Specifies whether requests for the Qualification type are granted immediately, without prompting the Worker with a Qualification test.</span>
          </div>
        </label>

        <label className="block" ng-show="QualificationType.AutoGranted">
          <div><b>Auto Granted Value</b>
            <span className="help">The Qualification value to use for automatically granted Qualifications.</span>
          </div>
          <input ng-model="QualificationType.AutoGrantedValue" />
        </label>
      </div>
    );
  }
}

export class QualificationTypeNew extends React.Component {
  render() {
    return (
      <div>
        <section className="hpad">
          <h3>CreateQualificationType</h3>
        </section>

        <section className="box hpad">
          <form ng-submit="sync($event)">
            <ng-include src="'/ui/admin/mturk/qualification_types/form.html'"></ng-include>

            <div className="block">
              <button>Submit</button>
            </div>
          </form>
        </section>
      </div>
    );
  }
}


export class QualificationTypeOne extends React.Component {
  render() {
    return (
      <div>
        <section className="hpad">
          <h3>Qualification Type: {QualificationType.QualificationTypeId}</h3>
          <h4>Name: {QualificationType.Name}</h4>
          <h4>Keywords: {QualificationType.Keywords}</h4>
        </section>

        <section className="box hpad">
          <form ng-submit="sync($event)">
            <ng-include src="'/ui/admin/mturk/qualification_types/form.html'"></ng-include>

            <div className="block">
              <button>Submit</button>
            </div>
          </form>
        </section>

        <section className="hpad">
          <h3>Qualifications</h3>
        </section>

        <section className="box">
          <table className="striped lined padded fill">
            <thead>
              <tr>
                <th>Subject Id</th>
                <th>Grant Time</th>
                <th>Integer Value</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr ng-repeat="Qualification in Qualifications">
                <td>{Qualification.SubjectId}</a></td>
                <td><time>{Qualification.GrantTime | date:"yyyy-MM-dd"}</time></td>
                <td>{Qualification.IntegerValue}</td>
                <td>{Qualification.Status}</td>
                <td>
                  <button ng-click="deleteQualification(Qualification)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="hpad">
          <h3>Assign Qualification</h3>
          <label>
          <form ng-submit="assignQualification($event)">
            <label>
              <div><b>WorkerId</b></div>
              <input ng-model="$storage.AssignQualification.WorkerId" />
            </label>
            <label>
              <div><b>Value</b></div>
              <input type="number" ng-model="$storage.AssignQualification.IntegerValue" />
            </label>
            <label>
              <div>
                <input type="checkbox" ng-model="$storage.AssignQualification.SendNotification" />
                <b>Send Notification</b>
              </div>
            </label>
            <button>Submit</button>
          </form>
        </section>
      </div>
    );
  }
}
