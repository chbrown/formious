'use strict'; /*jslint nomen: true, node: true, indent: 2, debug: true, vars: true, es5: true */
var mechturk_params = require('./mechturk-params');
var mechturk = require('mechturk');
var logger = require('./logger');
var amulet = require('amulet');
var async = require('async');
var formidable = require('formidable');
var __ = require('underscore');
var moment = require('moment');

var durationStringToSeconds = function(s) {
  // takes a string like "5h" and returns 5*60*60 (number of seconds)
  var matches = s.match(/\d+\w/g);
  var duration = moment.duration(0);
  matches.forEach(function(match) {
    var parts = match.match(/(\d+)(\w)/);
    // console.log('+', parts[1], parts[2]);
    duration.add(parseInt(parts[1], 10), parts[2]);
  });
  return duration.asSeconds();
};
// flattenDuration('5h');

module.exports = function(R) {
  function authenticate(req, res) {
    // document.cookie = 'wepEdYrVaigs=true;path=/';
    var cookie_name = process.env.MT_PASSWORD || 'wepEdYrVaigs';
    if (!req.cookies.get(cookie_name)) {
      res.die("Unauthenticated.");
      return true;
    }
    return false;
  }

  // R.post(/^\/accounts\/(\w+)\/(\w+)\/(\w+)/, function(m, req, res) {
    // e.g., m[3] == CreateHit
  R.post(/^\/accounts\/(\w+)\/(\w+)\/CreateHIT/, function(m, req, res) {
    var turk_client = mechturk_params.mechturk(m[2], m[1], {logger: logger});
    new formidable.IncomingForm().parse(req, function(err, fields, files) {
      console.dir(fields);
      var params = {
        MaxAssignments: parseInt(fields.MaxAssignments, 10),
        Title: fields.Title,
        Description: fields.Description,
        Reward: new mechturk.models.Price(parseFloat(fields.Reward)),
        Keywords: fields.Keywords,
        Question: new mechturk.models.ExternalQuestion(fields.ExternalURL, parseInt(fields.FrameHeight, 10)),
        AssignmentDurationInSeconds: durationStringToSeconds(fields.AssignmentDuration || 0),
        LifetimeInSeconds: durationStringToSeconds(fields.Lifetime || 0),
        AutoApprovalDelayInSeconds: durationStringToSeconds(fields.AutoApprovalDelay || 0),
      };
      turk_client.CreateHIT(params, function(err, result) {
        logger.maybe(err);
        res.json(result || 'error');
      });
    });
  });

  R.get(/^\/accounts\/(\w+)\/(\w+)/, function(m, req, res) {
    authenticate(req, res);
    // /accounts/[account]/[host]
    var ctx = {
      accounts: mechturk_params.accounts,
      account: __.findWhere(mechturk_params.accounts, {id: m[1]}),
      aws_hosts: mechturk_params.hosts,
      aws_host: __.findWhere(mechturk_params.hosts, {id: m[2]}),
    };

    // logger.debug(JSON.stringify(process.env));
    // logger.debug(JSON.stringify(mechturk.accounts));
    // logger.debug("ctx.account.secretAccessKey: " + ctx.account.secretAccessKey);
    // mechturk(host_id, account_id);
    var turk_client = mechturk_params.mechturk(m[2], m[1], {logger: logger});
    turk_client.GetAccountBalance({}, function(err, result) {
      logger.maybe(err);
      // {"GetAccountBalanceResponse":{"OperationRequest":{"RequestId":"9ef506b"},
      // "GetAccountBalanceResult": {"Request":{"IsValid":"True"},"AvailableBalance":
      // {"Amount":"10000.000","CurrencyCode":"USD","FormattedPrice":"$10,000.00"}}}}
      // console.log('result', result);
      ctx.available_price = result.GetAccountBalanceResult.AvailableBalance;
      amulet.render(res, ['layout.mu', 'admin.mu'], ctx);
    });
  });

  R.post(/^\/accounts/, function(m, req, res) {
    authenticate(req, res);
    res.json('Accounts index. Hi.');
  });

};

/*
def interactive_review():
    hits = turk.get_all_hits()
    for hit in hits:
        print 'Hit: %s (%s)' % (hit.Title, hit.HITId)
        assignments = turk.get_assignments(hit.HITId)
        for a in assignments:
            print '  AcceptTime: %s, SubmitTime: %s, AutoApprovalTime: %s' % (
                a.AcceptTime, a.SubmitTime, a.AutoApprovalTime)
            print '  Worker: %s, AssignmentId: %s, AssignmentStatus: %s' % (a.WorkerId, a.AssignmentId, a.AssignmentStatus)

            answers = a.answers[0]
            for answer in sorted(answers, key=lambda n: n.qid):
                print '    ', answer.qid, answer.fields[0]

            if hasattr(a, 'ApprovalTime'):
                print '  ApprovalTime: %s' % a.ApprovalTime
            elif hasattr(a, 'RejectionTime'):
                print '  RejectionTime: %s' % a.RejectionTime
            else:
                print 'y to approve, n to reject, anything else to skip'
                c = getch()
                if c == 'y':
                    print 'Approving', a.AssignmentId
                    turk.approve_assignment(a.AssignmentId)
                elif c == 'n':
                    print 'Rejecting', a.AssignmentId
                    turk.reject_assignment(a.AssignmentId)


def answers_in_hit(title):
    for hit in turk.get_all_hits():
        if title in hit.Title:
            stderr('Matched HIT: %s (%s)\n' % (hit.Title, hit.HITId))
            page_size = 10
            for page_number in range(1, 100):
                assignments = turk.get_assignments(hit.HITId, page_number=page_number, page_size=page_size)
                for assignment in assignments:
                    if hasattr(assignment, 'ApprovalTime'):
                        for answer_set in assignment.answers:
                            vals = dict(submitted=assignment.SubmitTime)
                            for question in answer_set:
                                assert len(question.fields) == 1
                                vals[question.qid] = question.fields[0]
                            yield vals

                if page_number * page_size >= int(assignments.TotalNumResults):
                    break
*/

/*
def collect(title, exclude=None):
    records = list(answers_in_hit(title))
    colset = set(col for record in records for col in record.keys() + ['submitted']) - set(exclude or [])
    cols = sorted(list(colset))
    stdout('%s\n' % ','.join(cols))
    for record in records:
        for col in cols:
            cell = record.get(col, '')
            if ',' in cell:
                cell = ''%s'' % cell.replace(''', r'''')
            stdout('%s,' % cell)
        stdout('\n')
*/

// make_hit(opts.url)
// # collect('English Language Grammaticality Judgments', exclude=['jsenabled', 'ghostkiller', 'originalHitId', 'pageload'])
// # interactive_review()

// # $ py botox.py --credentials ut --url http://turk.enron.me/ --deploy
