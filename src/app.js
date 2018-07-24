import { Editor } from 'slate-react'
import { Value, Block } from 'slate'
import PluginEditTable from 'slate-edit-table';
import React from 'react'
import PropTypes from 'prop-types';
import { isKeyHotkey } from 'is-hotkey'
import CannerEditor from 'canner-slate-editor';
import { a, Icon, Toolbar, Button } from './components'
import alignPlugin from './aligns';
import stateToPdfMake  from './state-to-pdf-make';

const font = 'SourceHanSerifCN';
const ttf = 'SourceHanSerifCN-Regular.ttf';


const tablePlugin = PluginEditTable({
  typeTable: 'table',
  typeRow: 'table_row',
  typeCell: 'table_cell',
  typeContent: 'paragraph'
});

function renderNode(props) {
  switch (props.node.type) {
    case 'table':
      return <Table {...props} />;
    case 'table_row':
      return <TableRow {...props} />;
    case 'table_cell':
      return <TableCell {...props} />;
    case 'paragraph':
      return <Paragraph {...props} />;
    case 'heading':
      return <h1 {...props.attributes}>{props.children}</h1>;
    default:
      return null;
  }
}



const plugins = [tablePlugin, alignPlugin, { renderNode }];

class Table extends React.Component {
  static childContextTypes = {
    isInTable: PropTypes.bool
  };

  getChildContext() {
    return { isInTable: true };
  }

  render() {
    const { attributes, children } = this.props;
    return (
      <table>
        <tbody {...attributes}>{children}</tbody>
      </table>
    );
  }
}

class TableRow extends React.Component {
  render() {
    const { attributes, children } = this.props;
    return <tr {...attributes}>{children}</tr>;
  }
}

class TableCell extends React.Component {
  render() {
    const { attributes, children, node } = this.props;

    const textAlign = node.get('data').get('align', 'left');

    return (
      <td style={{ textAlign }} {...attributes}>
        {children}
      </td>
    );
  }
}

class Paragraph extends React.Component{
  static contextTypes = {
    isInTable: PropTypes.bool
  };

  render() {
    const { attributes, children } = this.props;
    const { isInTable } = this.context;

    const style = isInTable ? { margin: 0 } : {};

    return (
      <p style={style} {...attributes}>
        {children}
      </p>
    );
  }
}

const initialValue = {
  "document": {
    "nodes": [
      {
        "object": "block",
        "type": "paragraph",
        "nodes": [
          {
            "object": "text",
            "leaves": [
              {
                "text": "报表导出测试!"
              }
            ]
          }
        ]
      }
    ]
  }
}

/**
 * Define the default node type.
 *
 * @type {String}
 */

const DEFAULT_NODE = 'paragraph'

/**
 * Define hotkey matchers.
 *
 * @type {Function}
 */

const isBoldHotkey = isKeyHotkey('mod+b')
const isItalicHotkey = isKeyHotkey('mod+i')
const isUnderlinedHotkey = isKeyHotkey('mod+u')
const isCodeHotkey = isKeyHotkey('mod+`')

/**
 * The rich text example.
 *
 * @type {Component}
 */

class RichTextExample extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: Value.fromJSON(initialValue),
    };
    if (window.pdfMake) {
      window.pdfMake.fonts = {
        [font]: {
          normal: ttf,
          bold: 'SourceHanSerifCN-Bold.ttf',
          italics: ttf,
          bolditalics: ttf,
        } };
    }
  }
  
  /**
   * Check if the current selection has a mark with `type` in it.
   *
   * @param {String} type
   * @return {Boolean}
   */

  hasMark = type => {
    const { value } = this.state
    return value.activeMarks.some(mark => mark.type == type)
  }

  renderTableToolbar() {
    return (
      <div className="toolbar">
        <button onMouseDown={this.onInsertColumn}>Insert Column</button>
        <button onMouseDown={this.onInsertRow}>Insert Row</button>
        <button onMouseDown={this.onRemoveColumn}>Remove Column</button>
        <button onMouseDown={this.onRemoveRow}>Remove Row</button>
        <button onMouseDown={this.onRemoveTable}>Remove Table</button>
        <br />
        <button onMouseDown={e => this.onSetAlign(e, 'left')}>
          左对齐
            </button>
        <button onMouseDown={e => this.onSetAlign(e, 'center')}>
         居中
            </button>
        <button onMouseDown={e => this.onSetAlign(e, 'right')}>
          右对齐
            </button>
      </div>
    );
  }

  renderNormalToolbar() {
    return (
      <div className="toolbar">
        <button onClick={this.onInsertTable}>Insert Table</button>
      </div>
    );
  }

  setEditorComponent = (ref) => {
    this.editorREF = ref;
    this.submitChange = ref.change;
  };

  onInsertTable = event => {
    event.preventDefault();
    this.submitChange(tablePlugin.changes.insertTable);
  };

  onInsertColumn = event => {
    event.preventDefault();
    this.submitChange(tablePlugin.changes.insertColumn);
  };

  onInsertRow = event => {
    event.preventDefault();
    this.submitChange(tablePlugin.changes.insertRow);
  };

  onRemoveColumn = event => {
    event.preventDefault();
    this.submitChange(tablePlugin.changes.removeColumn);
  };

  onRemoveRow = event => {
    event.preventDefault();
    this.submitChange(tablePlugin.changes.removeRow);
  };

  onRemoveTable = event => {
    event.preventDefault();
    this.submitChange(tablePlugin.changes.removeTable);
  };
  onSetAlign = (event, align) => {
    event.preventDefault();
    this.submitChange(change =>
      alignPlugin.changes.setColumnAlign(change, align)
    );
  };

  onExport = (event)=> {
    const { value } = this.state;
    console.log(value.toJS());
    const pdfmakeContents = stateToPdfMake(value.toJS());
    console.log(pdfmakeContents);
    window.pdfMake.createPdf({
      ...pdfmakeContents,
      defaultStyle: {
        font,
      },
      info: {
        title:  'Betalpha',
        author: 'Betalpha',
        keywords: 'Betalpha',
      },
    }).download('Beptalpha');
  };

  /**
   * Check if the any of the currently selected blocks are of `type`.
   *
   * @param {String} type
   * @return {Boolean}
   */

  hasBlock = type => {
    const { value } = this.state
    return value.blocks.some(node => node.type == type)
  }

  /**
   * Render.
   *
   * @return {Element}
   */

  render() {
    const { value } = this.state;
    const isInTable = tablePlugin.utils.isSelectionInTable(value);
    const isOutTable = tablePlugin.utils.isSelectionOutOfTable(value);

    return (
      <div>
        <div onClick={this.onExport} >导出</div>
        <div className={'Toolbar'}>
          {this.renderMarkButton('bold', 'bold')}
          {this.renderMarkButton('underline', 'underline')}
          {this.renderBlockButton('h1', 'H1')}
          {this.renderBlockButton('h2', 'H2')}
          {this.renderBlockButton('h3', 'H3')}
          {this.renderBlockButton('ol', 'ordered')}
          {this.renderBlockButton('ul', 'unordered')}

          {isInTable ? this.renderTableToolbar() : null}
          {isOutTable ? this.renderNormalToolbar() : null}

        </div>
        <Editor
          spellCheck
          autoFocus
          placeholder="Enter some rich text..."
          value={this.state.value}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
          renderNode={this.renderNode}
          renderMark={this.renderMark}
          ref={this.setEditorComponent}
          plugins={plugins}
        />
        <CannerEditor
        value={value}
        onChange={onChange}
        />
      </div>
    )
  }

  /**
   * Render a mark-toggling toolbar button.
   *
   * @param {String} type
   * @param {String} icon
   * @return {Element}
   */

  renderMarkButton = (type, icon) => {
    const isActive = this.hasMark(type)

    return (
      <Button
        active={isActive}
        onMouseDown={event => this.onClickMark(event, type)}
      >
        <Icon>{icon}</Icon>
      </Button>
    )
  }

  /**
   * Render a block-toggling toolbar button.
   *
   * @param {String} type
   * @param {String} icon
   * @return {Element}
   */

  renderBlockButton = (type, icon) => {
    let isActive = this.hasBlock(type)

    if (['ol', 'ul'].includes(type)) {
      const { value } = this.state
      const parent = value.document.getParent(value.blocks.first().key)
      isActive = this.hasBlock('list-item') && parent && parent.type === type
    }

    return (
      <Button
        active={isActive}
        onMouseDown={event => this.onClickBlock(event, type)}
      >
        <Icon>{icon}</Icon>
      </Button>
    )
  }

  /**
   * Render a Slate node.
   *
   * @param {Object} props
   * @return {Element}
   */

  renderNode = props => {
    const { attributes, children, node } = props

    switch (node.type) {
      case 'ul':
        return <ul {...attributes}>{children}</ul>
      case 'h1':
        return <h1 {...attributes}>{children}</h1>
      case 'h2':
        return <h2 {...attributes}>{children}</h2>
      case 'h3':
        return <h3 {...attributes}>{children}</h3>
      case 'list-item':
        return <li {...attributes}>{children}</li>
      case 'ol':
        return <ol {...attributes}>{children}</ol>
    }
  }

  /**
   * Render a Slate mark.
   *
   * @param {Object} props
   * @return {Element}
   */

  renderMark = props => {
    const { children, mark, attributes } = props

    switch (mark.type) {
      case 'bold':
        return <strong {...attributes}>{children}</strong>
      case 'code':
        return <code {...attributes}>{children}</code>
      case 'italic':
        return <em {...attributes}>{children}</em>
      case 'underline':
        return <u {...attributes}>{children}</u>
    }
  }

  /**
   * On change, save the new `value`.
   *
   * @param {Change} change
   */

  onChange = ({ value }) => {
    this.setState({ value })
  }

  /**
   * On key down, if it's a formatting command toggle a mark.
   *
   * @param {Event} event
   * @param {Change} change
   * @return {Change}
   */

  onKeyDown = (event, change) => {
    let mark

    if (isBoldHotkey(event)) {
      mark = 'bold'
    } else if (isItalicHotkey(event)) {
      mark = 'italic'
    } else if (isUnderlinedHotkey(event)) {
      mark = 'underline'
    } else if (isCodeHotkey(event)) {
      mark = 'code'
    } else {
      return
    }

    event.preventDefault()
    change.toggleMark(mark)
    return true
  }

  /**
   * When a mark button is clicked, toggle the current mark.
   *
   * @param {Event} event
   * @param {String} type
   */

  onClickMark = (event, type) => {
    event.preventDefault()
    const { value } = this.state
    const change = value.change().toggleMark(type)
    this.onChange(change)
  }

  /**
   * When a block button is clicked, toggle the block type.
   *
   * @param {Event} event
   * @param {String} type
   */

  onClickBlock = (event, type) => {
    event.preventDefault()
    const { value } = this.state
    const change = value.change()
    const { document } = value

    // Handle everything but list buttons.
    if (type != 'ul' && type != 'ol') {
      const isActive = this.hasBlock(type)
      const isList = this.hasBlock('list-item')

      if (isList) {
        change
          .setBlocks(isActive ? DEFAULT_NODE : type)
          .unwrapBlock('ul')
          .unwrapBlock('ol')
      } else {
        change.setBlocks(isActive ? DEFAULT_NODE : type)
      }
    } else {
      // Handle the extra wrapping required for list buttons.
      const isList = this.hasBlock('list-item')
      const isType = value.blocks.some(block => {
        return !!document.getClosest(block.key, parent => parent.type == type)
      })

      if (isList && isType) {
        change
          .setBlocks(DEFAULT_NODE)
          .unwrapBlock('ul')
          .unwrapBlock('ol')
      } else if (isList) {
        change
          .unwrapBlock(
            type == 'ul' ? 'ol' : 'ul'
          )
          .wrapBlock(type)
      } else {
        change.setBlocks('list-item').wrapBlock(type)
      }
    }

    this.onChange(change)
  }
}

/**
 * Export.
 */

export default RichTextExample