import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'filter'
})
export class FilterPipe implements PipeTransform {

    transform(items: any[], searchText: string, fieldName: string, size: number): any[] {

        if (!items) {
            return [];
        }

        if (!searchText) {
            return items;
        }

        searchText = searchText.toLowerCase();
        const flatItems = items.flat();
        const filteredFlatItems =  flatItems.filter(item => {
            if (item && item[fieldName]) {
                return item[fieldName].toLowerCase().includes(searchText);
            }
            return false;
        });
        const filterItemsGroupBy = [];
        while (filteredFlatItems.length > 0) {
            filterItemsGroupBy.push(filteredFlatItems.splice(0, size));
        }
        return filterItemsGroupBy;
    }
}
