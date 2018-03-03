// required for generators
import 'babel/polyfill';

// handmade autofill (just as bad? or worse.)
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(searchElement, fromIndex) {
      if (fromIndex) {
        return this.slice(fromIndex).indexOf(searchElement) !== -1;
      }
      return this.indexOf(searchElement) !== -1;
    },
  });
}

// import the app first
import './admin/app';
// then the app components
import './admin/models';
import './admin/access_tokens/controllers';
import './admin/administrators/controllers';
import './admin/aws_accounts/controllers';
import './admin/experiments/controllers';
import './admin/experiments/blocks/controllers';
import './admin/mturk/controllers';
import './admin/responses/controllers';
import './admin/templates/controllers';
