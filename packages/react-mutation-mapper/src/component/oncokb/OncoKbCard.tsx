import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import classnames from 'classnames';
import { computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';

import { ICache } from '../../model/SimpleCache';

import oncoKbLogoImgSrc from '../../images/oncokb.svg';
import mainStyles from './main.module.scss';
import { OncoKbCardTitle } from './OncoKbCardTitle';
import { OncoKbCardBody } from './OncoKbCardBody';
import { OncoKbCardDataType } from 'cbioportal-utils';

export type OncoKbCardProps = {
    type: OncoKbCardDataType;
    hugoSymbol: string;
    geneNotExist: boolean;
    isCancerGene: boolean;
    usingPublicOncoKbInstance: boolean;
    pmidData: ICache;
    indicator?: IndicatorQueryResp;
    handleFeedbackOpen?: React.EventHandler<any>;
};

@observer
export default class OncoKbCard extends React.Component<OncoKbCardProps> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @computed
    get oncokbLinkOut() {
        let link: string | undefined = undefined;
        if (this.props.hugoSymbol) {
            link = `https://www.oncokb.org/gene/${this.props.hugoSymbol}`;
            if (
                !this.props.geneNotExist &&
                this.props.indicator &&
                this.props.indicator.variantExist
            ) {
                link = `${link}/${this.props.indicator.query.alteration}`;
            }
        }
        return link;
    }

    // TODO we should replace the tabs with an actual ReactBootstrap Tab,
    public render() {
        const oncokbLogo = (
            <img
                src={oncoKbLogoImgSrc}
                className={mainStyles['oncokb-logo']}
                alt="OncoKB"
            />
        );
        return (
            <div className={mainStyles['oncokb-card']} data-test="oncokb-card">
                <div>
                    {!this.props.geneNotExist && this.props.indicator && (
                        <OncoKbCardTitle
                            hugoSymbol={this.props.indicator.query.hugoSymbol}
                            variant={this.props.indicator.query.alteration}
                            tumorType={
                                this.props.indicator
                                    ? this.props.indicator.query.tumorType
                                    : ''
                            }
                        />
                    )}
                    <OncoKbCardBody
                        type={this.props.type}
                        indicator={this.props.indicator}
                        geneNotExist={this.props.geneNotExist}
                        isCancerGene={this.props.isCancerGene}
                        hugoSymbol={this.props.hugoSymbol}
                        pmidData={this.props.pmidData}
                        usingPublicOncoKbInstance={
                            this.props.usingPublicOncoKbInstance
                        }
                    />
                    <div className={mainStyles.footer}>
                        {this.oncokbLinkOut === undefined ? (
                            { oncokbLogo }
                        ) : (
                            <a
                                href={`${this.oncokbLinkOut}`}
                                target="_blank"
                                className={mainStyles['oncokb-logo']}
                            >
                                {oncokbLogo}
                            </a>
                        )}
                        {this.props.handleFeedbackOpen && (
                            <span>
                                <button
                                    className="btn btn-default btn-xs"
                                    onClick={this.props.handleFeedbackOpen}
                                >
                                    Feedback
                                </button>
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}
