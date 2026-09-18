import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { MoreHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
function flatten(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flatten(child.props.children)
      : [child],
  )
}
export function RowActions({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const actions = flatten(children)
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      {actions.slice(0, 2)}
      {actions.length > 2 && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label={t('moreActions')}>
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="row-actions-menu">
            {actions.slice(2).map((action, index) => (
              <DropdownMenuItem
                key={index}
                disabled={isValidElement<{ disabled?: boolean }>(action) && action.props.disabled}
                asChild
              >
                {isValidElement<ComponentProps<typeof Button>>(action) && action.type === Button
                  ? cloneElement(action, { variant: 'ghost' })
                  : action}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
