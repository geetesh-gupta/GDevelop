// @flow
import * as React from 'react';
import { List } from 'react-virtualized';
import ItemRow from './ItemRow';
import { AddListItem } from '../ListCommonItem';
import { listItemWith32PxIconHeight, listItemWithoutIconHeight } from '../List';
import { makeDragSourceAndDropTarget } from '../DragAndDrop/DragSourceAndDropTarget';
import DropIndicator from './DropIndicator';
import { ResponsiveWindowMeasurer } from '../Reponsive/ResponsiveWindowMeasurer';
import { ScreenTypeMeasurer } from '../Reponsive/ScreenTypeMeasurer';
import type { WidthType } from '../Reponsive/ResponsiveWidthMeasurer';

type Props<Item> = {|
  height: number,
  width: number,
  fullList: Array<Item>,
  selectedItems: Array<Item>,
  onAddNewItem?: () => void,
  addNewItemLabel?: React.Node | string,
  onRename: (Item, string) => void,
  getItemName: Item => string,
  getItemThumbnail?: Item => string,
  isItemBold?: Item => boolean,
  onItemSelected: (?Item) => void,
  onEditItem?: Item => void,
  renamedItem: ?Item,
  erroredItems?: { [string]: '' | 'error' | 'warning' },
  buildMenuTemplate: (Item, index: number) => any,
  onMoveSelectionToItem: (destinationItem: Item) => void,
  canMoveSelectionToItem?: ?(destinationItem: Item) => boolean,
  reactDndType: string,
|};

export default class SortableVirtualizedItemList<Item> extends React.Component<
  Props<Item>
> {
  _list: ?List;
  DragSourceAndDropTarget = makeDragSourceAndDropTarget<Item>(
    this.props.reactDndType
  );

  forceUpdateGrid() {
    if (this._list) this._list.forceUpdateGrid();
  }

  _renderItemRow(
    item: Item,
    index: number,
    windowWidth: WidthType,
    connectIconDragSource?: ?(React.Node) => React.Node
  ) {
    const {
      selectedItems,
      getItemThumbnail,
      erroredItems,
      isItemBold,
      onEditItem,
      renamedItem,
      getItemName,
    } = this.props;

    const nameBeingEdited = renamedItem === item;
    const itemName = getItemName(item);

    return (
      <ItemRow
        item={item}
        itemName={itemName}
        isBold={isItemBold ? isItemBold(item) : false}
        onRename={newName => this.props.onRename(item, newName)}
        editingName={nameBeingEdited}
        getThumbnail={
          getItemThumbnail ? () => getItemThumbnail(item) : undefined
        }
        selected={selectedItems.indexOf(item) !== -1}
        onItemSelected={this.props.onItemSelected}
        errorStatus={erroredItems ? erroredItems[itemName] || '' : ''}
        buildMenuTemplate={() => this.props.buildMenuTemplate(item, index)}
        onEdit={onEditItem}
        hideMenuButton={windowWidth === 'small'}
        connectIconDragSource={connectIconDragSource || null}
      />
    );
  }

  render() {
    const {
      height,
      width,
      fullList,
      addNewItemLabel,
      renamedItem,
      getItemThumbnail,
      onAddNewItem,
      onMoveSelectionToItem,
      canMoveSelectionToItem,
    } = this.props;
    const { DragSourceAndDropTarget } = this;

    return (
      <ResponsiveWindowMeasurer>
        {windowWidth => (
          <ScreenTypeMeasurer>
            {screenType => (
              <List
                ref={list => (this._list = list)}
                height={height}
                rowCount={fullList.length + (onAddNewItem ? 1 : 0)}
                rowHeight={
                  getItemThumbnail
                    ? listItemWith32PxIconHeight
                    : listItemWithoutIconHeight
                }
                rowRenderer={({
                  index,
                  key,
                  style,
                }: {|
                  index: number,
                  key: string,
                  style: Object,
                |}) => {
                  if (index >= fullList.length) {
                    return (
                      <div style={style} key={key}>
                        <AddListItem
                          disabled
                          onClick={onAddNewItem}
                          primaryText={addNewItemLabel}
                        />
                      </div>
                    );
                  }

                  const item = fullList[index];
                  const nameBeingEdited = renamedItem === item;

                  return (
                    <div style={style} key={key}>
                      <DragSourceAndDropTarget
                        beginDrag={() => {
                          this.props.onItemSelected(item);
                          return {};
                        }}
                        canDrag={() => !nameBeingEdited}
                        canDrop={() =>
                          canMoveSelectionToItem
                            ? canMoveSelectionToItem(item)
                            : true
                        }
                        drop={() => {
                          onMoveSelectionToItem(item);
                        }}
                      >
                        {({
                          connectDragSource,
                          connectDropTarget,
                          isOver,
                          canDrop,
                        }) => {
                          // Add an extra div because connectDropTarget/connectDragSource can
                          // only be used on native elements
                          const dropTarget = connectDropTarget(
                            <div>
                              {isOver && <DropIndicator canDrop={canDrop} />}
                              {this._renderItemRow(
                                item,
                                index,
                                windowWidth,
                                screenType === 'touch' // Set the icon to be draggable, only if on a touch screen
                                  ? connectDragSource
                                  : null
                              )}
                            </div>
                          );

                          return screenType === 'touch'
                            ? dropTarget
                            : connectDragSource(dropTarget);
                        }}
                      </DragSourceAndDropTarget>
                    </div>
                  );
                }}
                width={width}
              />
            )}
          </ScreenTypeMeasurer>
        )}
      </ResponsiveWindowMeasurer>
    );
  }
}
