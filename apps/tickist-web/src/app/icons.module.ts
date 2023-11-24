import { NgModule } from "@angular/core";
import { FaIconLibrary, FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";

@NgModule({
    imports: [FontAwesomeModule],
    exports: [FontAwesomeModule],
})
export class IconsModule {
    constructor(private library: FaIconLibrary) {
        // add icons to the library for convenient access in other components
        // this.library.addIcons(faBars, faThumbtack, faFilter, faPlus, faSun, faDesktop, faReply, faEllipsisV, faEdit, faFastForward,
        // faTimes,
        //     faTags,
        //     faFolder, faReplyAll, faComment, faRedo, faFilter, faSort, faCalendar, faSitemap, faSearch, faShare, faArrowUp, faArrowDown,
        //     faPenSquare, faWrench, faBell, faChartLine, faCog, faTag, faList, faQuestion, faArrowsAlt, faTrashAlt, faExpand, faCompress,
        //     faArrowsAltV, faCompressArrowsAlt, faSquare, faCheckSquare, faPause, fasCircle, faDotCircle, faArrowRight, faClock,
        //     faCircleNotch, fasBell, faGoogle, faFacebookF,
        //     faUserPlus, faSign, faSignInAlt, faCalendarDay, faArrowAltCircleRight, faExclamationCircle, faChartLine, faBell, faCircle
        // );
        this.library.addIconPacks(far, fas, fab);
    }
}
