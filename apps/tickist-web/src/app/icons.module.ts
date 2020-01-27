import {NgModule} from '@angular/core';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {
    faArrowDown,
    faArrowRight,
    faArrowsAlt,
    faArrowsAltV,
    faArrowUp,
    faBars,
    faCalendar,
    faCalendarDay,
    faChartLine,
    faCircle,
    faCog,
    faComment,
    faCompress,
    faCompressArrowsAlt,
    faDesktop,
    faEdit,
    faEllipsisV,
    faExpand,
    faFastForward,
    faFilter,
    faFolder,
    faList,
    faPause,
    faPenSquare,
    faPlus,
    faQuestion,
    faRedo,
    faReply,
    faReplyAll,
    faSearch,
    faShare,
    faSignInAlt,
    faSitemap,
    faSort,
    faSun,
    faTag,
    faTags,
    faThumbtack,
    faTimes,
    faTrashAlt,
    faUserPlus,
    faWrench,
    faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faArrowAltCircleRight, faCheckSquare, faClock, faDotCircle, faSquare, faBell} from '@fortawesome/free-regular-svg-icons';
import {faSign} from '@fortawesome/free-solid-svg-icons/faSign';

@NgModule({
    imports: [ FontAwesomeModule ],
    exports: [ FontAwesomeModule ]
})
export class IconsModule {
    constructor() {
        // add icons to the library for convenient access in other components
        library.add(faBars, faThumbtack, faFilter, faPlus, faSun, faDesktop, faReply, faEllipsisV, faEdit, faFastForward, faTimes, faTags,
            faFolder, faReplyAll, faComment, faRedo, faFilter, faSort, faCalendar, faSitemap, faSearch, faShare, faArrowUp, faArrowDown,
            faPenSquare, faWrench, faBell, faChartLine, faCog, faTag, faList, faQuestion, faArrowsAlt, faTrashAlt, faExpand, faCompress,
            faArrowsAltV, faCompressArrowsAlt, faSquare, faCheckSquare, faPause, faCircle, faDotCircle, faArrowRight, faClock,
            faUserPlus, faSign, faSignInAlt, faCalendarDay, faArrowAltCircleRight, faExclamationCircle, faChartLine, faBell);
    }
}
