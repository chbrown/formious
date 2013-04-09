  'use strict'; /*jslint nomen: true, node: true, indent: 2, debug: true, vars: true, es5: true */
var mechturk = require('mechturk');
var logger = require('./logger');
var amulet = require('amulet');
var async = require('async');
var __ = require('underscore');

var accounts = [
  {
    id: 'chris',
    accessKeyId: process.env.AWS_CHRIS_ID,
    secretAccessKey: process.env.AWS_CHRIS_SECRET
  },
  {
    id: 'ut',
    accessKeyId: process.env.AWS_UT_ID,
    secretAccessKey: process.env.AWS_UT_SECRET
  }
];

var aws_hosts = [
  {
    id: 'deploy',
    url: 'mechanicalturk.amazonaws.com',
  },
  {
    id: 'sandbox',
    url: 'mechanicalturk.sandbox.amazonaws.com'
  }
];

module.exports = function(R) {

  R.post(/^\/accounts/, function(m, req, res) {
    res.json(res || 'error');

  });


  R.get(/^\/accounts\/(\w+)\/(\w+)/, function(m, req, res) {
    var ctx = {
      accounts: accounts,
      account: __.find(accounts, function(account) { return account.id == [m[1]]; }),
      aws_hosts: aws_hosts,
      aws_host: __.find(aws_hosts, function(host) { return host.id == [m[2]]; }),
    };

    var turk_client = mechturk({
      url: 'https://' + ctx.aws_host.url,
      accessKeyId: ctx.account.accessKeyId,
      secretAccessKey: ctx.account.secretAccessKey
    });

    turk_client.GetAccountBalance({}, function(err, result) {
      logger.maybe(err);
      // {"GetAccountBalanceResponse":{"OperationRequest":{"RequestId":"9ef506b"},"GetAccountBalanceResult":{"Request":{"IsValid":"True"},"AvailableBalance":{"Amount":"10000.000","CurrencyCode":"USD","FormattedPrice":"$10,000.00"}}}}
      ctx.available_price = result.GetAccountBalanceResponse.GetAccountBalanceResult.AvailableBalance;
      amulet.render(res, ['layout.mu', 'admin.mu'], ctx);
    });
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

/*
def make_hit(url):
    frameheight = 580
    ext_question = ExternalQuestion(url, frameheight)
    hit_set = turk.create_hit(
        question=ext_question,
        max_assignments=18,
        reward=0.75,
        title='Airplane Identification',
        description='Identify photos of planes as enemy or friend, '
            'factoring in the numbers of planes in the sky and judgments from your allies. '
            '100 friend / enemy responses.',
        keywords=['airplane', 'identification', 'visual', 'pictures'],
        duration=timedelta(hours=5),  # worker must complete in how long?
        lifetime=timedelta(hours=24),  # stay on mech turk for how long?
        approval_delay=timedelta(days=3)  # auto-approve after 3 days
    )

    stderr('Added %d HITs\n' % len(hit_set))
    for hit in hit_set:
        stderr('- hit_id: %s (hit_type: %s)\n' % (hit.HITId, hit.HITTypeId))
*/


// make_hit(opts.url)
// # collect('English Language Grammaticality Judgments', exclude=['jsenabled', 'ghostkiller', 'originalHitId', 'pageload'])
// # interactive_review()

// # $ py botox.py --credentials ut --url http://turk.enron.me/ --deploy
