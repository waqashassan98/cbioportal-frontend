import * as React from 'react';
import { observer } from 'mobx-react';
import { ClinicalDataEnrichmentWithQ } from 'pages/groupComparison/GroupComparisonUtils';
import LazyMobXTable from 'shared/components/lazyMobXTable/LazyMobXTable';
import { ClinicalDataEnrichmentTableColumnType } from 'pages/groupComparison/ClinicalDataEnrichmentsTable';
import autobind from 'autobind-decorator';
import { SimpleGetterLazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import { toConditionalPrecisionWithMinimum } from 'shared/lib/FormatUtils';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { filterNumericalColumn } from 'shared/components/lazyMobXTable/utils';
import _ from 'lodash';
import { toggleColumnVisibility } from 'cbioportal-frontend-commons';
import { IColumnVisibilityDef } from 'shared/components/columnVisibilityControls/ColumnVisibilityControls';
import { observable, computed } from 'mobx';

export interface ISurvivalPrefixTableProps {
    survivalPrefixes: SurvivalPrefixSummary[];
    groupNames: string[];
    getSelectedPrefix: () => string | undefined;
    setSelectedPrefix: (p: string) => void;
}

export type SurvivalPrefixSummary = {
    prefix: string;
    displayText: string;
    numPatients: number;
    numPatientsPerGroup: { [groupName: string]: number };
    pValue: number | null;
    qValue: number | null;
};

class SurvivalPrefixTableStore extends SimpleGetterLazyMobXTableApplicationDataStore<
    SurvivalPrefixSummary
> {
    constructor(
        getData: () => SurvivalPrefixSummary[],
        getSelectedPrefix: () => string | undefined
    ) {
        super(getData);
        this.dataHighlighter = (d: SurvivalPrefixSummary) => {
            return d.prefix === getSelectedPrefix();
        };
    }
}

enum ColumnName {
    P_VALUE = 'p-Value',
}

function makeGroupColumnName(groupName: string) {
    return `# in ${groupName}`;
}
function makeGroupColumn(groupName: string) {
    const name = makeGroupColumnName(groupName);
    return {
        name,
        render: (d: SurvivalPrefixSummary) => (
            <span>{d.numPatientsPerGroup[groupName]}</span>
        ),
        sortBy: (d: SurvivalPrefixSummary) => d.numPatientsPerGroup[groupName],
        filter: filterNumericalColumn(
            (d: SurvivalPrefixSummary) => d.numPatientsPerGroup[groupName],
            name
        ),
        download: (d: SurvivalPrefixSummary) =>
            d.numPatientsPerGroup[groupName].toString(),
    };
}

const COLUMNS = [
    {
        name: 'Survival Type',
        render: (d: SurvivalPrefixSummary) => <span>{d.displayText}</span>,
        filter: (
            d: SurvivalPrefixSummary,
            f: string,
            filterStringUpper: string
        ) => d.displayText.toUpperCase().indexOf(filterStringUpper) > -1,
        sortBy: (d: SurvivalPrefixSummary) => d.displayText,
        download: (d: SurvivalPrefixSummary) => d.displayText,
    },
    {
        name: '# Patients With Data',
        render: (d: SurvivalPrefixSummary) => <span>{d.numPatients}</span>,
        sortBy: (d: SurvivalPrefixSummary) => d.numPatients,
        filter: filterNumericalColumn(
            (d: SurvivalPrefixSummary) => d.numPatients,
            '# Patients With Data'
        ),
        download: (d: SurvivalPrefixSummary) => d.numPatients.toString(),
    },
    {
        name: ColumnName.P_VALUE,
        render: (d: SurvivalPrefixSummary) => (
            <span>
                {d.pValue !== null
                    ? toConditionalPrecisionWithMinimum(d.pValue, 3, 0.01, -10)
                    : 'N/A'}
            </span>
        ),
        sortBy: (d: SurvivalPrefixSummary) => d.pValue,
        filter: filterNumericalColumn(
            (d: SurvivalPrefixSummary) => d.pValue,
            ColumnName.P_VALUE
        ),
        download: (d: SurvivalPrefixSummary) =>
            d.pValue !== null
                ? toConditionalPrecision(d.pValue, 3, 0.01)
                : 'N/A',
        tooltip: <span>Derived from Log Rank test.</span>,
    },
    {
        name: 'q-Value',
        render: (d: SurvivalPrefixSummary) => (
            <span>
                {d.qValue !== null
                    ? toConditionalPrecisionWithMinimum(d.qValue, 3, 0.01, -10)
                    : 'N/A'}
            </span>
        ),
        sortBy: (d: SurvivalPrefixSummary) => d.qValue,
        filter: filterNumericalColumn(
            (d: SurvivalPrefixSummary) => d.qValue,
            'q-Value'
        ),
        download: (d: SurvivalPrefixSummary) =>
            d.qValue !== null
                ? toConditionalPrecision(d.qValue, 3, 0.01)
                : 'N/A',
        tooltip: (
            <span>
                Derived from Benjamini-Hochberg FDR correction procedure.
            </span>
        ),
    },
];

function initColumnVisibility(groupNames: string[]) {
    const ret: { [group: string]: boolean } = {};
    for (const c of COLUMNS) {
        ret[c.name] = true;
    }
    for (const n of groupNames) {
        ret[makeGroupColumnName(n)] = false;
    }
    return ret;
}

@observer
export default class SurvivalPrefixTable extends React.Component<
    ISurvivalPrefixTableProps,
    {}
> {
    private dataStore: SurvivalPrefixTableStore;
    @observable private columnVisibility: { [group: string]: boolean };

    constructor(props: ISurvivalPrefixTableProps) {
        super(props);
        this.dataStore = new SurvivalPrefixTableStore(
            () => this.props.survivalPrefixes,
            this.props.getSelectedPrefix
        );
        this.columnVisibility = initColumnVisibility(props.groupNames);
    }
    @autobind
    private onRowClick(d: SurvivalPrefixSummary) {
        this.props.setSelectedPrefix(d.prefix);
    }

    @autobind
    private onColumnToggled(
        columnId: string,
        columnVisibilityDefs: IColumnVisibilityDef[]
    ) {
        this.columnVisibility = toggleColumnVisibility(
            this.columnVisibility,
            columnId,
            columnVisibilityDefs
        );
    }

    @computed get columns() {
        const cols = COLUMNS.slice();
        const insertionPoint = cols.findIndex(
            c => c.name === ColumnName.P_VALUE
        );
        // insert "Num patients in group" columns right before p value
        return [
            ...COLUMNS.slice(0, insertionPoint),
            ...this.props.groupNames.map(makeGroupColumn),
            ...COLUMNS.slice(insertionPoint),
        ];
    }

    public render() {
        return (
            <LazyMobXTable
                columns={this.columns}
                showColumnVisibility={true}
                columnVisibility={this.columnVisibility}
                columnVisibilityProps={{
                    onColumnToggled: this.onColumnToggled,
                }}
                initialFilterString={'patients>10'}
                initialSortColumn={ColumnName.P_VALUE}
                initialSortDirection={'asc'}
                dataStore={this.dataStore}
                onRowClick={this.onRowClick}
                paginationProps={{ itemsPerPageOptions: [15] }}
                initialItemsPerPage={15}
                copyDownloadProps={{
                    showCopy: false,
                }}
            />
        );
    }
}
