import { CloudAccount, CloudRole, CloudEnvironment, CloudProvider, RoleHighlightStyle } from '../entrypoints/options/types';
import { AWSAccountSelectionHandler } from './account-selection-handlers/AWSAccountSelectionHandler';
import { AliyunAccountSelectionHandler } from './account-selection-handlers/AliyunAccountSelectionHandler';
import { VolcengineAccountSelectionHandler } from './account-selection-handlers/VolcengineAccountSelectionHandler';
import { HuaweiAccountSelectionHandler } from './account-selection-handlers/HuaweiAccountSelectionHandler';
import { GenericAccountSelectionHandler } from './account-selection-handlers/GenericAccountSelectionHandler';

interface IAccountSelectionHandler {
    applyHighlighting(environment: CloudEnvironment, accounts: CloudAccount[]): void;
    removeHighlighting(): void;
}

export class AccountSelectionHighlighter {
    private awsHandler: AWSAccountSelectionHandler;
    private aliyunHandler: AliyunAccountSelectionHandler;
    private volcengineHandler: VolcengineAccountSelectionHandler;
    private huaweiHandler: HuaweiAccountSelectionHandler;
    private genericHandler: GenericAccountSelectionHandler;
    private currentHandler: IAccountSelectionHandler | null = null;

    constructor() {
        this.awsHandler = new AWSAccountSelectionHandler();
        this.aliyunHandler = new AliyunAccountSelectionHandler();
        this.volcengineHandler = new VolcengineAccountSelectionHandler();
        this.huaweiHandler = new HuaweiAccountSelectionHandler();
        this.genericHandler = new GenericAccountSelectionHandler();
    }

    public applyHighlighting(environment: CloudEnvironment, accounts: CloudAccount[]): void {
        if (environment.provider === CloudProvider.AWS_CN ||
            environment.provider === CloudProvider.AWS_GLOBAL) {
            this.currentHandler = this.awsHandler;
        } else if (environment.provider === CloudProvider.ALIYUN) {
            this.currentHandler = this.aliyunHandler;
        } else if (environment.provider === CloudProvider.VOLCENGINE) {
            this.currentHandler = this.volcengineHandler;
        } else if (environment.provider === CloudProvider.HUAWEI) {
            this.currentHandler = this.huaweiHandler;
        } else {
            this.currentHandler = this.genericHandler;
        }

        this.currentHandler.applyHighlighting(environment, accounts);
    }

    public removeHighlighting(): void {
        this.awsHandler.removeHighlighting();
        this.aliyunHandler.removeHighlighting();
        this.volcengineHandler.removeHighlighting();
        this.huaweiHandler.removeHighlighting();
        this.genericHandler.removeHighlighting();
        this.currentHandler = null;
    }
}
