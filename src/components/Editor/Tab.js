/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import { showMenu, buildMenu } from "devtools-contextmenu";

import CloseButton from "../shared/Button/Close";

import type { List } from "immutable";
import type { SourceRecord } from "../../reducers/sources";

import actions from "../../actions";

import {
  getFilename,
  getFileURL,
  getRawSourceURL,
  isPretty
} from "../../utils/source";
import { copyToTheClipboard } from "../../utils/clipboard";
import { getSourceAnnotation, getTabMenuItems } from "../../utils/tabs";

import {
  getSelectedSource,
  getSourceMetaData,
  getActiveSearch,
  getSourcesForTabs
} from "../../selectors";

import classnames from "classnames";

type SourcesList = List<SourceRecord>;

type Props = {
  tabSources: SourcesList,
  selectSource: Object => void,
  selectedSource: SourceRecord,
  closeTab: string => void,
  closeTabs: (List<string>) => void,
  togglePrettyPrint: string => void,
  showSource: string => void,
  source: SourceRecord,
  activeSearch: string,
  sourceMetaData: string => any
};

class Tab extends PureComponent<Props> {
  onTabContextMenu = (event, tab: string) => {
    event.preventDefault();
    this.showContextMenu(event, tab);
  };

  showContextMenu(e, tab: string) {
    const {
      closeTab,
      closeTabs,
      tabSources,
      showSource,
      togglePrettyPrint
    } = this.props;

    const otherTabs = tabSources.filter(t => t.get("id") !== tab);
    const sourceTab = tabSources.find(t => t.get("id") == tab);
    const tabURLs = tabSources.map(t => t.get("url"));
    const otherTabURLs = otherTabs.map(t => t.get("url"));

    if (!sourceTab) {
      return;
    }

    const isPrettySource = isPretty(sourceTab);
    const tabMenuItems = getTabMenuItems();
    const items = [
      {
        item: {
          ...tabMenuItems.closeTab,
          click: () => closeTab(sourceTab.get("url"))
        }
      },
      {
        item: {
          ...tabMenuItems.closeOtherTabs,
          click: () => closeTabs(otherTabURLs)
        },
        hidden: () => tabSources.size === 1
      },
      {
        item: {
          ...tabMenuItems.closeTabsToEnd,
          click: () => {
            const tabIndex = tabSources.findIndex(t => t.get("id") == tab);
            closeTabs(tabURLs.filter((t, i) => i > tabIndex));
          }
        },
        hidden: () =>
          tabSources.size === 1 ||
          tabSources.some((t, i) => t === tab && tabSources.size - 1 === i)
      },
      {
        item: { ...tabMenuItems.closeAllTabs, click: () => closeTabs(tabURLs) }
      },
      { item: { type: "separator" } },
      {
        item: {
          ...tabMenuItems.copySourceUri2,
          click: () => copyToTheClipboard(getRawSourceURL(sourceTab.get("url")))
        }
      }
    ];

    if (!isPrettySource) {
      items.push({
        item: { ...tabMenuItems.showSource, click: () => showSource(tab) }
      });

      items.push({
        item: {
          ...tabMenuItems.prettyPrint,
          click: () => togglePrettyPrint(tab)
        }
      });
    }

    showMenu(e, buildMenu(items));
  }

  isProjectSearchEnabled() {
    return this.props.activeSearch === "project";
  }

  isSourceSearchEnabled() {
    return this.props.activeSearch === "source";
  }

  render() {
    const {
      selectedSource,
      selectSource,
      closeTab,
      source,
      sourceMetaData
    } = this.props;
    const src = source.toJS();
    const filename = getFilename(src);
    const sourceId = source.get("id");
    const active =
      selectedSource &&
      sourceId == selectedSource.get("id") &&
      (!this.isProjectSearchEnabled() && !this.isSourceSearchEnabled());
    const isPrettyCode = isPretty(source);
    const sourceAnnotation = getSourceAnnotation(source, sourceMetaData);

    function onClickClose(ev) {
      ev.stopPropagation();
      closeTab(source.get("url"));
    }

    const className = classnames("source-tab", {
      active,
      pretty: isPrettyCode
    });

    return (
      <div
        className={className}
        key={sourceId}
        onClick={() => selectSource(sourceId)}
        onContextMenu={e => this.onTabContextMenu(e, sourceId)}
        title={getFileURL(src)}
      >
        {sourceAnnotation}
        <div className="filename">{filename}</div>
        <CloseButton
          handleClick={onClickClose}
          tooltip={L10N.getStr("sourceTabs.closeTabButtonTooltip")}
        />
      </div>
    );
  }
}
export default connect(
  state => {
    const selectedSource = getSelectedSource(state);
    return {
      tabSources: getSourcesForTabs(state),
      selectedSource: selectedSource,
      sourceMetaData: getSourceMetaData(
        state,
        selectedSource && selectedSource.get("id")
      ),
      activeSearch: getActiveSearch(state)
    };
  },
  dispatch => bindActionCreators(actions, dispatch)
)(Tab);
