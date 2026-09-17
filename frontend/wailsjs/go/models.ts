export namespace models {
	
	export class BenchmarkResult {
	    iterations: number;
	    minTimeMs: number;
	    maxTimeMs: number;
	    avgTimeMs: number;
	    timingsMs: number[];
	    rowCount: number;
	    errorMessage?: string;
	
	    static createFrom(source: any = {}) {
	        return new BenchmarkResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.iterations = source["iterations"];
	        this.minTimeMs = source["minTimeMs"];
	        this.maxTimeMs = source["maxTimeMs"];
	        this.avgTimeMs = source["avgTimeMs"];
	        this.timingsMs = source["timingsMs"];
	        this.rowCount = source["rowCount"];
	        this.errorMessage = source["errorMessage"];
	    }
	}
	export class Collection {
	    id: string;
	    name: string;
	    parentId?: string;
	    sortOrder: number;
	    createdAt: string;
	    updatedAt: string;
	    itemCount: number;
	
	    static createFrom(source: any = {}) {
	        return new Collection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.parentId = source["parentId"];
	        this.sortOrder = source["sortOrder"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	        this.itemCount = source["itemCount"];
	    }
	}
	export class ColumnInfo {
	    name: string;
	    dataType: string;
	    isNullable: boolean;
	    isPrimaryKey: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ColumnInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.dataType = source["dataType"];
	        this.isNullable = source["isNullable"];
	        this.isPrimaryKey = source["isPrimaryKey"];
	    }
	}
	export class ConnectionProfile {
	    id: string;
	    name: string;
	    driver: string;
	    host: string;
	    port: number;
	    database: string;
	    username: string;
	    password: string;
	    sslMode: string;
	    readOnly: boolean;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new ConnectionProfile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.driver = source["driver"];
	        this.host = source["host"];
	        this.port = source["port"];
	        this.database = source["database"];
	        this.username = source["username"];
	        this.password = source["password"];
	        this.sslMode = source["sslMode"];
	        this.readOnly = source["readOnly"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class ExecutionLog {
	    id: string;
	    profileId: string;
	    profileName: string;
	    sqlContent: string;
	    executionTimeMs: number;
	    rowCount: number;
	    status: string;
	    errorMessage?: string;
	    executedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new ExecutionLog(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.profileId = source["profileId"];
	        this.profileName = source["profileName"];
	        this.sqlContent = source["sqlContent"];
	        this.executionTimeMs = source["executionTimeMs"];
	        this.rowCount = source["rowCount"];
	        this.status = source["status"];
	        this.errorMessage = source["errorMessage"];
	        this.executedAt = source["executedAt"];
	    }
	}
	export class Query {
	    id: string;
	    title: string;
	    sqlContent: string;
	    description: string;
	    collectionId?: string;
	    dialect: string;
	    isFavorite: boolean;
	    createdAt: string;
	    updatedAt: string;
	    lastUsedAt: string;
	    tags: string[];
	
	    static createFrom(source: any = {}) {
	        return new Query(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.sqlContent = source["sqlContent"];
	        this.description = source["description"];
	        this.collectionId = source["collectionId"];
	        this.dialect = source["dialect"];
	        this.isFavorite = source["isFavorite"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	        this.lastUsedAt = source["lastUsedAt"];
	        this.tags = source["tags"];
	    }
	}
	export class QueryResult {
	    columns: string[];
	    rows: any[][];
	    rowCount: number;
	    executionTimeMs: number;
	    error?: string;
	    plan?: string;
	    isDestructive?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new QueryResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.columns = source["columns"];
	        this.rows = source["rows"];
	        this.rowCount = source["rowCount"];
	        this.executionTimeMs = source["executionTimeMs"];
	        this.error = source["error"];
	        this.plan = source["plan"];
	        this.isDestructive = source["isDestructive"];
	    }
	}
	export class QueryVersion {
	    id: string;
	    queryId: string;
	    sqlContent: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new QueryVersion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.queryId = source["queryId"];
	        this.sqlContent = source["sqlContent"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class SearchFilter {
	    searchText: string;
	    collectionId?: string;
	    tagId?: string;
	    dialect: string;
	    favoriteOnly: boolean;
	    quickFilter: string;
	
	    static createFrom(source: any = {}) {
	        return new SearchFilter(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.searchText = source["searchText"];
	        this.collectionId = source["collectionId"];
	        this.tagId = source["tagId"];
	        this.dialect = source["dialect"];
	        this.favoriteOnly = source["favoriteOnly"];
	        this.quickFilter = source["quickFilter"];
	    }
	}
	export class Settings {
	    theme: string;
	    density: string;
	    fontSize: number;
	    tabSize: number;
	    wordWrap: string;
	    formatOnPaste: boolean;
	    formatOnSave: boolean;
	    showMinimap: boolean;
	    lineNumbers: string;
	    defaultDialect: string;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	        this.density = source["density"];
	        this.fontSize = source["fontSize"];
	        this.tabSize = source["tabSize"];
	        this.wordWrap = source["wordWrap"];
	        this.formatOnPaste = source["formatOnPaste"];
	        this.formatOnSave = source["formatOnSave"];
	        this.showMinimap = source["showMinimap"];
	        this.lineNumbers = source["lineNumbers"];
	        this.defaultDialect = source["defaultDialect"];
	    }
	}
	export class TableInfo {
	    database?: string;
	    schema: string;
	    name: string;
	    type: string;
	    rowCount: number;
	    columns: ColumnInfo[];
	
	    static createFrom(source: any = {}) {
	        return new TableInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.database = source["database"];
	        this.schema = source["schema"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.rowCount = source["rowCount"];
	        this.columns = this.convertValues(source["columns"], ColumnInfo);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Tag {
	    id: string;
	    name: string;
	    usageCount: number;
	
	    static createFrom(source: any = {}) {
	        return new Tag(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.usageCount = source["usageCount"];
	    }
	}

}

export namespace updater {
	
	export class Info {
	    currentVersion: string;
	    latestVersion: string;
	    releaseUrl: string;
	    notes: string;
	    assetName: string;
	    assetUrl: string;
	    packageName: string;
	    packageUrl: string;
	    installHint: string;
	    available: boolean;
	    canInstall: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Info(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.currentVersion = source["currentVersion"];
	        this.latestVersion = source["latestVersion"];
	        this.releaseUrl = source["releaseUrl"];
	        this.notes = source["notes"];
	        this.assetName = source["assetName"];
	        this.assetUrl = source["assetUrl"];
	        this.packageName = source["packageName"];
	        this.packageUrl = source["packageUrl"];
	        this.installHint = source["installHint"];
	        this.available = source["available"];
	        this.canInstall = source["canInstall"];
	    }
	}
	export class Result {
	    restartRequired: boolean;
	    openedInstaller: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Result(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.restartRequired = source["restartRequired"];
	        this.openedInstaller = source["openedInstaller"];
	    }
	}

}

