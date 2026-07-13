const fs = require('fs');
let content = fs.readFileSync('src/bookings/bookings.service.ts', 'utf8');

// Replace missing modules
content = content.replace(/import \{ IsFutureDate \} from '\.\.\/\.\.\/common\/validators\/is-future-date\.validator';/g, "import { IsFutureDate } from '../common/validators/is-future-date.validator';");
content = content.replace(/import \{ StatusTransitions \} from '\.\.\/\.\.\/common\/status-transitions\.util';/g, "import { StatusTransitions } from '../common/status-transitions.util';");

// Remove includes
content = content.replace(/customer: true,?/g, '');
content = content.replace(/company: true,?/g, '');
content = content.replace(/payment: true,?/g, '');

// Comment out Prisma cross-service calls
content = content.replace(/await this\.prisma\.service\./g, '/* await this.prisma.service. */ null as any; //');
content = content.replace(/await this\.prisma\.companyStaff\./g, '/* await this.prisma.companyStaff. */ null as any; //');
content = content.replace(/await this\.prisma\.payment\./g, '/* await this.prisma.payment. */ null as any; //');
content = content.replace(/await this\.prisma\.notification\./g, '/* await this.prisma.notification. */ null as any; //');

fs.writeFileSync('src/bookings/bookings.service.ts', content);
