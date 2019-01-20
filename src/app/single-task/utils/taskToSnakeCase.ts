import {toSnakeCase} from '../../utils/toSnakeCase';
import {Task} from '../../models/tasks';


export function taskToSnakeCase(task: Task) {
    const result = toSnakeCase(task);
    result['steps'] = prepareSteps(task.steps);

    if (task.finishDate) {
        result['finish_date'] = task.finishDate.format();
    }
    return result;
}

function prepareSteps(steps) {
    const prefix_formset = 'steps';
    const formset_step = {};
    let index, i = 0,
        initial_forms_count = 0, reverse_index = steps.length - 1;
    if (steps.length > 0) {
        while (i < steps.length) {
            if (steps[i].id && !isNaN(steps[i].id)) {
                index = initial_forms_count;
                formset_step[prefix_formset + '-' + index + '-id'] = steps[i].id;
                initial_forms_count += 1;
            } else {
                index = reverse_index;
                reverse_index -= 1;
            }

            formset_step[prefix_formset + '-' + index + '-name'] = steps[i].name;
            formset_step[prefix_formset + '-' + index + '-status'] = steps[i].status;

            formset_step[prefix_formset + '-' + index + '-task'] = steps[i].taskId;
            formset_step[prefix_formset + '-' + index + '-order'] = i;

            if (steps[i].delete) {
                formset_step[prefix_formset + '-' + index + '-DELETE'] = steps[i].delete;
            }
            i += 1;
        }
        formset_step[prefix_formset + '-TOTAL_FORMS'] = steps.length;
        formset_step[prefix_formset + '-INITIAL_FORMS'] = initial_forms_count;
        formset_step[prefix_formset + '-MAX_NUM_FORMS'] = '';
    }
}
