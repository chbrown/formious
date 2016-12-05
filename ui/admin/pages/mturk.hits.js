import React from 'react';

export class MTurkHITsTable extends React.Component {
  render() {
    return (
      <div>
        <section className="hpad">
          <h3>HITs</h3>
          <a ui-sref="admin.mturk.hits.new">Create new HIT</a>
        </section>

        <section ng-if="hits.length === 0" className="hpad">
          <p>No HITs could be found.</p>
        </section>
        <section ng-repeat="hit in hits" className="box hpad">
          <h3>
            <a ui-sref="admin.mturk.hits.edit({HITId: hit.HITId})">{hit.Title}</a>
          </h3>
          <table className="keyval">
            <tr ng-repeat="(key, val) in hit">
              <td>{key}</td>
              <td>{val}</td>
            </tr>
          </table>
        </section>
      </div>
    );
  }
}

export class MTurkHITsNew extends React.Component {
  render() {
    return (
      <div>
        <section className="hpad">
          <h3>Operation:
            <select ng-model="$storage.Operation">
              <option value="CreateHIT">Create HIT</option>
              <option value="RegisterHITType">Register HIT Type</option>
            </select>
          </h3>
        </section>

        <section className="box hpad">
          <form ng-submit="sync($event)">
            <h3>Common parameters</h3>

            <label className="block">
              <div><b>Title</b>
                <span className="help">The title of the HIT. A title should be short and describe the kind of task the HIT contains</span>
              </div>
              <input type="text" ng-model="$storage.Title" style="width: 500px" />
            </label>

            <label className="block">
              <div><b>Description</b>
                <span className="help">2000 character max</span>
              </div>
              <textarea ng-model="$storage.Description" rows="2" style="width: 500px"></textarea>
            </label>

            <label className="block">
              <div><b>Reward</b>
                <span className="help">The amount of money (in USD) the Requester will pay a Worker for successfully completing the HIT</span>
              </div>
              <input type="text" ng-model="$storage.Reward" />
            </label>

            <label className="block">
              <div><b>Keywords</b>
                <span className="help">One or more words or phrases that describe the HIT, separated by commas</span>
              </div>
              <input type="text" ng-model="$storage.Keywords" style="width: 500px" />
            </label>

            <label className="block">
              <div><b>Assignment Duration (e.g., 3h)</b>
                <span className="help">The amount of time that a Worker has to complete the HIT after accepting it</span>
              </div>
              <input type="text" ng-model="$storage.AssignmentDurationInSeconds" duration-string />
            </label>

            <label className="block">
              <div><b>Auto-approval Delay (e.g., 60m)</b>
                <span className="help">The amount of time after a HIT has been submitted before the assignment is automatically approved</span>
              </div>
              <input type="text" ng-model="$storage.AutoApprovalDelayInSeconds" duration-string />
            </label>

            <label className="block">
              <div><b>Other settings</b>
                <span className="help">JSON representation of any other settings to send.
                  This is an object that will be merged with the rest of the payload.
                  E.g., to require Master's qualification in production, use this:
                  <code><pre>
                    {
                      "QualificationRequirement": {
                        "QualificationTypeId": "2F1QJWKUDD8XADTFD2Q0G6UTO95ALH",
                        "Comparator": "Exists"
                      }
                    }
                  </pre></code>
                </span>
              </div>
              <textarea json-transform enhance ng-model="$storage.extra"
                className="code" style="width: 500px; min-height: 50px;"></textarea>
            </label>

            <p></p>

            <div ng-show="$storage.Operation == 'CreateHIT'">
              <h3>HIT parameters</h3>

              <label className="block">
                <div><b>Max Assignments</b>
                  <span className="help">
                    The number of times the HIT can be accepted (by different users) and completed before the HIT becomes unavailable. A single user will only be able to complete the HIT once.
                  </span>
                </div>
                <input type="number" ng-model="$storage.MaxAssignments" />
              </label>

              <label className="block">
                <div><b>Lifetime (e.g., 3d)</b>
                  <span className="help">The amount of time that a HIT can be accepted; after the lifetime expires, the HIT no longer appears in searches</span>
                </div>
                <input type="text" ng-model="$storage.LifetimeInSeconds" duration-string />
              </label>

              <h3>HIT <code>Question</code> parameters</h3>

              <label className="block">
                <div><b>External URL</b>
                  <span className="help">The URL of your web form, to be displayed in a frame in the Worker's web browser. It can have a querystring; Mechanical Turk parses the url and adds new querystring parameters as needed.</span>
                </div>
                <input type="text" ng-model="$storage.ExternalURL" style="width: 500px" />
              </label>

              <label className="block" ng-show="$storage.Operation == 'CreateHIT'">
                <div><b>Frame Height (integer)</b>
                  <span className="help">The height of the frame, in pixels</span>
                </div>
                <input type="number" ng-model="$storage.FrameHeight" />
              </label>
            </div>

            <div className="block">
              <button>Submit</button>
            </div>

          </form>
        </section>

        <section className="hpad">
          <h3>
            <label>Preview <input type="checkbox" ng-model="$storage.preview_iframe" /></label>
          </h3>
        </section>

        <div ng-if="$storage.preview_iframe && preview_url">
          <pre className="hpad">{preview_url}</pre>
          <section className="box">
            <iframe src="{preview_url}" scrolling="auto" frameborder="0" align="center"
              width="100%" height="{$storage.FrameHeight}"></iframe>
          </section>
        </div>
      </div>
    );
  }
}

export class MTurkHITsEdit extends React.Component {
  render() {
    return (
      <div>
        <section className="hpad">
          <h3>HIT: {hit.Title}</h3>
        </section>

        <section className="box hpad">
          <table className="keyval">
            <tr ng-repeat="(key, val) in hit">
              <td>{key}</td><td>{val}</td>
            </tr>
          </table>
        </section>

        <section className="box hpad">
          <h3>ExtendHIT</h3>
          <span className="help">Extend the duration of this HIT or add assignments to it.</span>
          <form ng-submit="ExtendHIT($event)">
            <label>
              <div><b>Max Assignments Increment</b>
                <span className="help">
                  The number of assignments by which to increment the MaxAssignments parameter of the HIT.
                </span>
              </div>
              <input type="text" ng-model="extension.MaxAssignmentsIncrement" />
            </label>
            <label>
              <div><b>Expiration Increment (e.g., 24h)</b>
                <span className="help">The amount of time, in seconds, by which to extend the expiration date. If the HIT has not yet expired, this amount is added to the HIT's expiration date. If the HIT has expired, the new expiration date is the current time plus this value.</span>
              </div>
              <input type="text" ng-model="extension.ExpirationIncrement" />
            </label>
            <p><button>ExtendHIT</button></p>
          </form>
        </section>

        <section className="box hpad">
          <h3>Import</h3>
          <span className="help">Import data that was submitted to Mechanical Turk directly into the local database.<br>
            Because each Assignment has a unique identifier (the AssignmentId field), duplicate imports will be ignored.</span>
          <p>
            <form ng-submit="import($event)">
              <p><button>Import</button></p>
            </form>
          </p>
        </section>

        <section className="box hpad">
          <h3>Assign Qualifications</h3>
          <p>Assign qualification to all {assignments.length} workers that completed this HIT.</p>
          <form ng-submit="assignQualifications($event)">
            <label>
              <div><b>Qualification Type</b></div>
              <select ng-model="$storage.AssignQualification.QualificationTypeId"
                ng-options="QualificationType.QualificationTypeId as QualificationType.Name for QualificationType in QualificationTypes">
                <option value="">-- Qualification Type --</option>
              </select>
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
            <div>
              <button>Assign Qualifications</button>
            </div>
          </form>
        </section>

        <!-- <section className="box hpad">
          <h3>Export</h3>
          <div>
            <a href="{hit.HITId}.csv">HIT_{hit.HITId}.csv</a>
            &middot; <a href="{hit.HITId}.csv?view">View</a>
          </div>
          <div>
            <a href="{hit.HITId}.tsv">HIT_{hit.HITId}.tsv</a>
            &middot; <a href="{hit.HITId}.tsv?view">View</a>
          </div>
        </section> -->

        <section className="box hpad">
          <h3>Bonuses</h3>
          <table>
            <thead>
              <tr>
                <th>WorkerId</th>
                <th>BonusAmount</th>
                <th>Reason</th>
                <th>GrantTime</th>
              </tr>
            </thead>
            <tbody>
              <tr ng-repeat="bonus_payment in bonus_payments">
                <td>{bonus_payment.WorkerId}</td>
                <td>{bonus_payment.BonusAmount.FormattedPrice}</td>
                <td>{bonus_payment.Reason}</td>
                <td>{bonus_payment.GrantTime}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="hpad">
          <h3>Assignments</h3>
          <label>
            Show <input ng-model="$storage.assignments_limit" type="number" /> out of {assignments.length}
          </label>
          <label>
            <input ng-model="$storage.assignments_show_times" type="checkbox" /> <b>Show times</b>
          </label>
          <label>
            <input ng-model="$storage.assignments_show_bonus" type="checkbox" /> <b>Show bonus</b>
          </label>
          <label>
            <input ng-model="$storage.assignments_show_answer" type="checkbox" /> <b>Show answer</b>
          </label>
          <label>
            <input ng-model="$storage.assignments_show_block" type="checkbox" /> <b>Show 'Block worker'</b>
          </label>
          <label>
            <div>
              <b>Responses Summarizer</b>
              <span className="help">A Javascript function from an Array of responses to a serializable object summarizing the responses.</span>
            </div>
            <div className="code">function(responses, assignment) {</div>
            <div className="code" style="margin-left: 1em">
              <textarea enhance ng-model="$storage.responses_summarizer"
                className="code" style="width: 100%; min-height: 100px"></textarea>
            </div>
            <div className="code">}</div>
          </label>
        </section>

        <section className="box" ng-repeat="assignment in assignments | limitTo:$storage.assignments_limit">
          <div assignment="assignment"></div>
        </section>
      </div>
    );
  }
}
