<template>
  <details
    open
    class="options"
  >
    <summary class="title">
      参数设置
    </summary>
    <form class="form">
      <div
        v-for="item of formItems"
        :key="item.name"
        class="form-item"
      >
        <div class="label">
          {{ item.label }}:
        </div>

        <div class="value">
          <input
            v-if="['input', 'input-number'].includes(item.type)"
            v-model="mentionOptions[item.name]"
            :type="item.type === 'input' ? 'text' : 'number'"
          >

          <input
            v-else-if="item.type === 'checkbox'"
            v-model="mentionOptions[item.name]"
            type="checkbox"
          >

          <select
            v-else-if="item.type === 'select'"
            v-model="mentionOptions[item.name]"
          >
            <option
              v-for="option of item.options"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <dl class="dropdown-options">
        <dt class="title">
          提及列表
        </dt>
        <dd>
          <table width="100%">
            <thead>
              <tr>
                <th width="10%">
                  -
                </th>
                <th width="30%">
                  {{ mentionOptions.valueFieldName }}
                </th>
                <th width="30%">
                  {{ mentionOptions.labelFieldName }}
                </th>
                <th width="10%">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) of dropdownOptions"
                :key="`${row.id}-${index}`"
              >
                <td>{{ index + 1 }}</td>
                <td>
                  <input
                    :value="row.id"
                    @change="handleTableInputChange(row.id, 'id', $event)"
                  >
                </td>
                <td>
                  <input
                    :value="row.name"
                    @change="handleTableInputChange(row.id, 'name', $event)"
                  >
                </td>
                <td>
                  <a
                    href="javascript:;"
                    class="table-link danger"
                    title="移除当前行"
                    @click="removeRow(row)"
                  >
                    -
                  </a>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4">
                  <a
                    href="javascript:;"
                    class="table-link"
                    title="增加一行"
                    @click="addRow"
                  >
                    +
                  </a>
                </td>
              </tr>
            </tfoot>
          </table>
        </dd>
      </dl>
    </form>
  </details>
</template>

<script setup>
import { ref, watch } from 'vue'

const emits = defineEmits(['change'])

const mentionOptions = ref({
  type: 'input',
  value: '',
  initialValue: '',
  disabled: false,
  readonly: false,
  prefix: '@',
  suffix: '',
  maxLength: 0,
  getMentionLength: null,
  showStatistics: null,
  formatter: null,
  labelFieldName: 'name',
  valueFieldName: 'id',
  optionsFetchApi: null,
  immediate: false,
  filterOption: (option, filterValue) => option.name.toLowerCase().includes(filterValue.toLowerCase()),
  dropdownMaxWidth: null,
  dropdownMaxHeight: 200
})

const dropdownOptions = ref([
  { id: '1', name: 'John' },
  { id: '2', name: 'Jack' },
  { id: '3', name: 'Tom' },
  { id: '4', name: 'Jerry' }
])

const formItems = [
  {
    name: 'type',
    type: 'select',
    label: '类型',
    options: [
      { label: 'input', value: 'input' },
      { label: 'textarea', value: 'textarea' }
    ]
  },
  {
    name: 'value',
    type: 'input',
    label: '内容'
  },
  {
    name: 'initialValue',
    type: 'input',
    label: '默认内容'
  },
  {
    name: 'disabled',
    type: 'checkbox',
    label: '禁用'
  },
  {
    name: 'readonly',
    type: 'checkbox',
    label: '只读'
  },
  {
    name: 'prefix',
    type: 'input',
    label: '提及块前缀'
  },
  {
    name: 'suffix',
    type: 'input',
    label: '提及块后缀'
  },
  {
    name: 'maxLength',
    type: 'input-number',
    label: '内容长度限制'
  },
  {
    name: 'dropdownMaxWidth',
    type: 'input-number',
    label: '下拉框最大宽度'
  },
  {
    name: 'dropdownMaxHeight',
    type: 'input-number',
    label: '下拉框最大高度'
  },
  {
    name: 'labelFieldName',
    type: 'input',
    label: 'label字段'
  },
  {
    name: 'valueFieldName',
    type: 'input',
    label: 'value字段'
  }
]

watch([mentionOptions, dropdownOptions], () => {
  console.log('change?', mentionOptions.value, dropdownOptions.value)
  emits('change', mentionOptions.value, dropdownOptions.value)
}, { immediate: true, deep: true })

const removeRow = (row) => {
  dropdownOptions.value = dropdownOptions.value.filter(item => item.id !== row.id)
}

const addRow = () => {
  dropdownOptions.value.push({
    id: '',
    name: ''
  })
}

const handleTableInputChange = (id, fieldName, e) => {
  const value = e.target.value

  const row = dropdownOptions.value.find(item => item.id === id)

  if (row) {
    row[fieldName] = value
  }
}
</script>

<style scoped>
.options {
  margin-bottom: 16px;
  padding: 16px 0;
  border-bottom: 1px solid;
}

.form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: calc(50% - 8px);
}

.form-item .label {
  width: 150px;
  text-align: right;
}

input,
select {
  padding: 2px 8px;
  border: 1px solid;
  border-radius: 4px;
}

.dropdown-options {
  width: 100%;
}

dt {
  font-weight: 700;
}

dd {
  margin: 0;
}

.table-link {
  display: block;
  width: 24px;
  height: 24px;
  margin: 0 auto;
  text-align: center;
  line-height: 24px;
  font-size: 24px;
  text-decoration: none;
}

.table-link.danger {
  color: #f40;
}
</style>
