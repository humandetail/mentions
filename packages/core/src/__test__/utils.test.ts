import {
  describe,
  test,
  expect,
  it
} from 'vitest'

import {
  computeMentionLength,
  createAtElement,
  createMentionElement,
  getMentionPattern,
  getValueLength,
  insertNodeAfterRange,
  integerValidator,
  isEmptyTextNode,
  isMention,
  isNodeAfterNode,
  mergeOptions,
  setRangeAfterNode,
  valueFormatter
} from '../utils'
import { DOM_CLASSES, MENTION_REG, initialOptions } from '../config'
import type { MentionDropdownListOption } from '../libs/renderer'
import type { MentionOptions } from '../mentions'

describe('utils', () => {
  test('mergeOptions', () => {
    expect(mergeOptions()).toEqual(initialOptions)

    const options: MentionOptions = {
      type: 'textarea',
      value: '123',
      initialValue: '',
      disabled: false,
      readonly: false,
      prefix: '#',
      suffix: '_',
      maxLength: 0,
      getMentionLength: () => 1,
      showStatistics: () => '123',
      formatter: null,
      options: [],
      labelFieldName: 'label',
      valueFieldName: 'value',
      optionsFetchApi: null,
      immediate: true,
      filterOption: (option: MentionDropdownListOption, filterValue: string) => option.name.toLowerCase().includes(filterValue.toLowerCase()),
      dropdownMaxWidth: 200,
      dropdownMaxHeight: 200
    }

    expect(mergeOptions(options)).toEqual(options)
  })

  test('computePosition', () => {
    expect('todo').toBe('todo')
  })

  test('createAtElement', () => {
    const oAt = createAtElement('#')
    expect(oAt.tagName).toBe('SPAN')
    expect(oAt.className).toBe(DOM_CLASSES.AT)
    expect(oAt.textContent).toBe('#')
  })

  test('createMentionElement', () => {
    const oM = createMentionElement('张三', '1', '#', '_')
    expect(oM.tagName).toBe('EM')
    expect(oM.className).toBe(DOM_CLASSES.MENTION)
    expect(oM.getAttribute('data-id')).toBe('1')
    expect(oM.getAttribute('data-name')).toBe('张三')
    expect(oM.getAttribute('contenteditable')).toBe('false')

    expect(oM.textContent).toBe('#张三_')
  })

  test('insertNodeAfterRange', () => {
    const sel = window.getSelection()!
    const range = new Range()
    range.setStart(document.body, 0)
    range.setEnd(document.body, 0)
    sel.removeAllRanges()
    sel.addRange(range)
    const oDiv = document.createElement('div')

    insertNodeAfterRange(oDiv)
    expect(document.body.firstElementChild).toBe(oDiv)
  })

  test('setRangeAfterNode', () => {
    document.body.innerHTML = '<div>a</div><span>b</span>'
    const oDiv = document.querySelector('div')

    setRangeAfterNode(oDiv as Node)
    const {
      anchorNode,
      anchorOffset,
      focusNode,
      focusOffset
    } = window.getSelection()!
    expect(anchorNode).toBe(document.body)
    expect(focusNode).toBe(document.body)
    expect(anchorOffset).toBe(1)
    expect(focusOffset).toBe(1)
  })

  test('isNodeAfterNode', () => {
    document.body.innerHTML = '<div>a</div><span>b</span>'
    const oDiv = document.querySelector('div') as Node
    const oSpan = document.querySelector('span') as Node

    expect(isNodeAfterNode(oDiv, oSpan)).toBe(true)
    expect(isNodeAfterNode(oSpan, oDiv)).toBe(false)
  })

  test('isMention', () => {
    document.body.innerHTML = `
      <div class="div1 ${DOM_CLASSES.MENTION}"><span class="span1">1</span></div>
      <div class="div2"><span class="span2">2</span></div>
    `

    const oDiv1 = document.querySelector('.div1')
    const oSpan1 = document.querySelector('.span1')
    const oDiv2 = document.querySelector('.div2')
    const oSpan2 = document.querySelector('.span2')

    expect(isMention(oDiv1 as Node)).toBeTruthy()
    expect(isMention(oSpan1 as Node)).toBeTruthy()
    expect(isMention(oDiv2 as Node)).toBeFalsy()
    expect(isMention(oSpan2 as Node)).toBeFalsy()
  })

  test('integerValidator', () => {
    expect(integerValidator(0)).toBeFalsy()
    expect(integerValidator(1)).toBeTruthy()
    expect(integerValidator('1' as unknown as number)).toBeFalsy()
    expect(integerValidator(1.1)).toBeFalsy()
  })

  it('valueFormatter', () => {
    const innerHTML = `Hi, <em class="${DOM_CLASSES.MENTION}" data-id="1" data-name="张三">@张三 </em>, This is <em class="${DOM_CLASSES.MENTION}" data-id="2" data-name="李四">@李四 </em>.<br/>Nice to meet you.`
    test('without parser', () => {
      expect(valueFormatter(innerHTML))
        .toBe('Hi, #{name:张三,id:1}, This is #{name:李四,id:2}.\nNice to meet you.')
    })

    test('with parser', () => {
      expect(valueFormatter(innerHTML, 'name', 'id', (id, name) => `@[${id}]:[${name}]`))
        .toBe('Hi, @[1][张三], This is @[2][李四].\nNice to meet you.')
    })
  })

  test('isEmptyTextNode', () => {
    expect(isEmptyTextNode(document.createElement('div'))).toBeFalsy()
    expect(isEmptyTextNode(document.createTextNode(''))).toBeTruthy()
    expect(isEmptyTextNode(document.createTextNode(' '))).toBeFalsy()
  })

  it('computeMentionLength', () => {
    const mentionOption: MentionDropdownListOption = {
      id: '1',
      name: '张三'
    }
    test('without calculator', () => {
      expect(computeMentionLength(mentionOption)).toEqual(14)
    })
    test('with calculator', () => {
      expect(computeMentionLength(mentionOption, 'name', 'id', () => 2)).toEqual(2)
    })
  })

  test('getMentionPattern', () => {
    const pattern = /#{name:([^}]+?),id:([^}]+?)}/g
    expect(getMentionPattern(pattern).global).toEqual(/#{name:([^}]+?),id:([^}]+?)}/g)
    expect(getMentionPattern(pattern).single).toEqual(/#{name:([^}]+?),id:([^}]+?)}/)
  })

  test('getValueLength', () => {
    const value = 'Hi, #{name:张三,id:1}, This is #{name:李四,id:2}.\nNice to meet you.'
    expect(getValueLength(value)).toEqual(value.length)
    expect(getValueLength(value, 'name', 'id', /#ABCDEF/)).toEqual(value.length)
    expect(getValueLength(value, 'name', 'id', MENTION_REG, () => 2)).toEqual(value.length - 13 * 2)
  })
})
