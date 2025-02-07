import * as React from 'react';
import _ from 'lodash';
import styles from './styles.module.scss';
import { If } from 'react-if';
import contrast from 'contrast';
import { computed, makeObservable } from 'mobx';

export interface IPillTagProps {
    content: string;
    backgroundColor: string;
    infoSection?: JSX.Element | null;
    onDelete?: () => void;
}

export class PillTag extends React.Component<IPillTagProps, {}> {
    constructor(props: IPillTagProps) {
        super(props);
        makeObservable(this);
    }

    @computed
    get contentColor() {
        let _contrast = contrast(this.props.backgroundColor);
        if (_contrast === 'light') {
            return '#000';
        } else {
            return '#fff';
        }
    }

    render() {
        return (
            <div
                className={styles.main}
                style={{
                    background: this.props.backgroundColor,
                    color: this.contentColor,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <span className={styles.content}>{this.props.content}</span>
                    {this.props.infoSection}
                </div>
                <If condition={_.isFunction(this.props.onDelete)}>
                    <span
                        data-test="pill-tag-delete"
                        className={styles.delete}
                        onClick={this.props.onDelete}
                    >
                        <i className="fa fa-times-circle"></i>
                    </span>
                </If>
            </div>
        );
    }
}
